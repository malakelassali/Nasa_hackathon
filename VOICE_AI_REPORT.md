# AgriX voice AI report

## Status

The standalone prototype implements push-to-talk, transcript review, session context, an agricultural tool interface, local synthesis, and consent-based annotation export. The repository has no existing AgriX application services to connect. The development adapter supplies labeled examples, and neither fetches NASA measurements nor saves production farm records.

## ASR smoke test

Three clips from the public `atlasia/MoulSot-Full` default test split were used locally. All three came from the same recording channel, with no agricultural terms or accent coverage. MoulSot is associated with this corpus. Treat the result as a smoke test with possible dataset overlap. See [the dataset](https://huggingface.co/datasets/atlasia/MoulSot-Full) and [the reproduction script](evaluation/public_asr_samples.py).

| Checkpoint | Raw WER / CER | Normalized WER / CER | Median / p95 inference | Load | Peak process RSS |
| --- | --- | --- | --- | --- | --- |
| Whisper Base | 80.0% / 42.9% | 80.0% / 41.1% | 1.52 / 1.66 s | 8.83 s | 770 MiB |
| MoulSot v0.3 | 30.0% / 14.3% | 30.0% / 14.3% | 8.94 / 9.91 s | 25.30 s | 8,332 MiB |

Runs used CPU PyTorch 2.7.1, four compute threads and a Windows machine with 15.7 GiB total RAM. MoulSot is the initial domain candidate given its better score on this small sample. A concurrent workload caused a cold API request to time out. MaghrebVoice was reviewed as a Darija Whisper checkpoint. The Whisper Large V3 Turbo weight download stopped early. Neither candidate has a measured result here. [MoulSot](https://huggingface.co/atlasia/moulsot.v0.3) · [MaghrebVoice](https://huggingface.co/Ayoub-Laachir/MaghrebVoice) · [Whisper Large V3 Turbo](https://huggingface.co/openai/whisper-large-v3-turbo)

## Synthesis and conversation

SpeechT5 generated all five Latin-Darija prompts. The five outputs were 2.18–4.00 seconds long and took 3.83–12.51 seconds each to generate, with a median of 6.13 seconds. Cold load took 12.55 seconds and peak process RSS was 1,113 MiB. The test used the author's public demo embedding for evaluation. Native pronunciation and naturalness ratings are pending. Kandir's pinned OuteTTS runtime failed to build a dependency on this Windows host. NeuTTS requires the author's Darija phonemizer and a compatible reference. Both remain candidates pending rendered comparisons. [SpeechT5](https://huggingface.co/HAMMALE/speecht5-darija) · [Kandir](https://huggingface.co/KandirResearch/DarijaTTS-v0.1-500M) · [NeuTTS](https://huggingface.co/Tilas/neutts-air-darija-v1)

Qwen2.5 1.5B's initial parsing prompt matched two of nine expected fields on the four scripted cases. That run was slow and predated the shorter prompt now in the code. Re-run both the current prompt and Atlas-Chat on identical cases before selecting an LLM. Fixed Darija replies use typed adapter results so the parser cannot supply its own NASA measurements or recommendations. [Qwen2.5](https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct) · [Atlas-Chat](https://huggingface.co/MBZUAI-Paris/Atlas-Chat-2B)

## Dataset and training

- DODa's card lists MIT and describes an ASR-assisted correction pass. The published schema lacks a speaker identifier, so a speaker-disjoint split and transcript quality need verification before training. [DODa card](https://huggingface.co/datasets/atlasia/DODa-audio-dataset/blob/main/README.md)
- MoulSot describes media-derived recordings. AgriX only used public test clips to check inference and metrics. Confirm the source rights and intended split before any training use. [MoulSot-Full](https://huggingface.co/datasets/atlasia/MoulSot-Full)
- The MaghrebVoice model card lists Apache 2.0 for the model. Its source collection and Kandir's training corpus need separate rights review before reuse. Neither corpus was used for training. [MaghrebVoice dataset](https://huggingface.co/datasets/Ayoub-Laachir/Darija_Dataset) · [Kandir dataset](https://huggingface.co/datasets/KandirResearch/DarijaTTS-clean)
- Whisper Base LoRA completed an optimizer step, saved a checkpoint, resumed to step two, and loaded the adapter for inference. This used synthetic tones with one fixture per split to exercise the tooling. Rank was 16, alpha 32 and learning rate 0.0001. There is no trained Darija adaptation or domain accuracy gain from that run.

## Agricultural ASR pilot

Both speakers consented to local evaluation and training and reviewed all 20 prompts each. The importer cut 40 mono 16 kHz WAV clips from the six source recordings using the submitted timestamps. The clips total 212.26 seconds, range from 1.62 to 11.30 seconds, and pass the audio format and signal-level checks. Recording environment was unspecified. The pilot preserves the submitted references and uses a second pass with manually transcribed Arabic-script equivalents for the Arabizi passages. French words stay in Latin script. The second pass is provisional because Darija spellings and word boundaries vary. The source recordings, derived corpus, and per-clip reports are ignored by Git.

| Model | Normalized WER, submitted | Normalized WER, script-aligned | Script-aligned CER | Exact term recall | Median / p95 CPU inference |
| --- | ---: | ---: | ---: | ---: | ---: |
| MoulSot v0.3 | 60.9% | 30.7% | 13.8% | 39/54 (72.2%) | 11.43 / 21.93 s |
| Whisper Base | 140.7% | 138.4% | 94.8% | 2/54 (3.7%) | 1.35 / 6.07 s |

WER can exceed 100% because extra generated words count as insertions. Term recall requires an exact normalized match and may penalize equivalent spellings or transliterated French terms. MoulSot's normalized WER was 35.6% on read prompts, 31.5% on answers in the speaker's own words, 19.8% on follow-ups, and 50.6% on the six Darija/French clips. Warm inference timing excludes load. MoulSot took 20.74 s to load and peaked at 8,038 MiB process RSS. Whisper Base took 7.45 s to load and peaked at 792 MiB. The pilot supports keeping MoulSot as the prototype ASR while retaining transcript correction, especially on mixed-language inputs. Two speakers and repeated prompts limit generalizability.

The local benchmark artifacts are in `runs/darija-pilot-*.json`. No fine-tuning used the pilot audio. At least one more distinct speaker is needed for the existing speaker-disjoint three-way split.

## Next evaluation

Use verified recordings from different Darija speakers to score the three requested ASR models on the same clips. Report agricultural term recall, digits and units, French code-switching, noise and regional slices alongside overall WER and CER. Collect native-speaker ratings on blinded TTS and conversation samples. Add more speakers before making a disjoint train, validation and test split. Connect authenticated farm data and recommendations when the AgriX application source becomes available.
