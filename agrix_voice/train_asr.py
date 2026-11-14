import argparse
import json
from pathlib import Path

import numpy as np

from .audio import SAMPLE_RATE, read_recording
from .corpus import Clip, manifest_rows, normalize_transcript


def split_rows(root):
    speakers = set()
    clips = set()
    result = {}
    for split in ("train", "validation", "test"):
        rows = [Clip.model_validate(row) for row in manifest_rows(root / f"{split}.jsonl")]
        group = {row.speaker for row in rows}
        ids = {row.id for row in rows}
        if not rows or speakers & group or clips & ids or len(ids) != len(rows):
            raise ValueError(f"Empty, duplicate or overlapping split: {split}")
        speakers.update(group)
        clips.update(ids)
        result[split] = rows
    return result


def training_audio(audio, seed):
    rng = np.random.default_rng(seed)
    rms = np.sqrt(np.mean(audio ** 2))
    noise = rng.normal(0, rms / 10 ** (rng.uniform(18, 32) / 20), audio.shape)
    return np.clip(audio * rng.uniform(0.8, 1.15) + noise, -1, 1).astype(np.float32)


def train(args):
    import torch
    from peft import LoraConfig, get_peft_model
    from torch.utils.data import Dataset
    from transformers import (
        Seq2SeqTrainer, Seq2SeqTrainingArguments, WhisperForConditionalGeneration, WhisperProcessor,
        set_seed,
    )

    root = args.corpus.resolve()
    rows = split_rows(root)
    set_seed(args.seed)
    processor = WhisperProcessor.from_pretrained(
        args.model, revision=args.revision, language="ar", task="transcribe",
    )
    base = WhisperForConditionalGeneration.from_pretrained(
        args.model, revision=args.revision, use_safetensors=True,
    )
    # The generic PEFT wrapper passes Whisper's input_features through unchanged.
    model = get_peft_model(base, LoraConfig(r=16, lora_alpha=32, lora_dropout=0.05,
                                          target_modules=["q_proj", "v_proj"]))

    class SpeechDataset(Dataset):
        def __init__(self, clips, augment):
            self.clips = clips
            self.augment = augment

        def __len__(self):
            return len(self.clips) * (2 if self.augment else 1)

        def __getitem__(self, index):
            clip = self.clips[index % len(self.clips)]
            path = (root / clip.audio).resolve()
            if not path.is_relative_to(root):
                raise ValueError("Audio path leaves the curated corpus")
            audio, _ = read_recording(path.read_bytes())
            if index >= len(self.clips):
                audio = training_audio(audio, args.seed + index)
            return {
                "input_features": processor.feature_extractor(audio, sampling_rate=SAMPLE_RATE).input_features[0],
                "labels": processor.tokenizer(normalize_transcript(clip.text)).input_ids,
            }

    def collate(batch):
        features = torch.tensor(np.stack([row["input_features"] for row in batch]))
        tokens = processor.tokenizer.pad(
            [{"input_ids": row["labels"]} for row in batch], return_tensors="pt",
        )
        labels = tokens.input_ids.masked_fill(tokens.attention_mask.ne(1), -100)
        if torch.all(labels[:, 0] == base.config.decoder_start_token_id):
            labels = labels[:, 1:]
        if labels.shape[1] > base.config.max_target_positions:
            raise ValueError("Transcript exceeds Whisper's decoder capacity")
        return {"input_features": features, "labels": labels}

    settings = Seq2SeqTrainingArguments(
        output_dir=str(args.output), learning_rate=1e-4, num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size, per_device_eval_batch_size=args.batch_size,
        gradient_accumulation_steps=args.accumulate, bf16=torch.cuda.is_bf16_supported(),
        eval_strategy="epoch", save_strategy="epoch", save_total_limit=3,
        load_best_model_at_end=True, metric_for_best_model="eval_loss", greater_is_better=False,
        remove_unused_columns=False, label_names=["labels"], report_to=[], seed=args.seed,
        max_steps=args.max_steps, dataloader_pin_memory=torch.cuda.is_available(),
    )
    trainer = Seq2SeqTrainer(
        model=model, args=settings, train_dataset=SpeechDataset(rows["train"], not args.no_augmentation),
        eval_dataset=SpeechDataset(rows["validation"], False), data_collator=collate,
        processing_class=processor,
    )
    outcome = trainer.train(resume_from_checkpoint=args.resume)
    trainer.save_model(str(args.output / "adapter"))
    trainer.save_state()
    report = {"model": args.model, "revision": args.revision, "seed": args.seed,
              "max_steps": args.max_steps, "epochs": args.epochs, "batch_size": args.batch_size,
              "gradient_accumulation": args.accumulate, "augmentation": not args.no_augmentation,
              "resume": args.resume,
              "splits": {name: len(split) for name, split in rows.items()},
              "training": outcome.metrics, "validation": trainer.evaluate()}
    (args.output / "training.json").write_text(json.dumps(report, indent=2), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Train Whisper LoRA on prepared Darija recordings")
    parser.add_argument("corpus", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--model", default="openai/whisper-small")
    parser.add_argument("--revision")
    parser.add_argument("--epochs", type=float, default=3)
    parser.add_argument("--batch-size", type=int, default=2)
    parser.add_argument("--accumulate", type=int, default=8)
    parser.add_argument("--seed", type=int, default=19)
    parser.add_argument("--max-steps", type=int, default=-1)
    parser.add_argument("--no-augmentation", action="store_true")
    parser.add_argument("--resume")
    train(parser.parse_args())


if __name__ == "__main__":
    main()
