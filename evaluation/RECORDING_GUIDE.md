# Darija recording and review

Ask every speaker for explicit consent for recording, local evaluation, and training. Explain what you will keep, who can access it, whether future model weights may be released, and how to request deletion. Obtain separate permission for publishing clips or using a speaker's voice for synthesis. Keep the consent record separate from the corpus. Use one pseudonymous code per speaker and avoid names, phone numbers, exact coordinates, and background voices.

Start with around 20–30 verified clips per speaker across several regions, accents, age ranges and device types. Capture both quiet indoor clips and real farm conditions such as wind or irrigation pumps. Use 3–15 seconds per clip. Mix scripted prompts with spontaneous versions and follow-up answers. Mark important terms and values exactly as spoken.

| Coverage | Prompt |
| --- | --- |
| Rotation | العام اللي فات زرعت القمح، آش نزرع من بعد منّو؟ |
| Crops and season | واش الشعير والعدس كيتزرعو فنفس الوقت؟ |
| Irrigation | الما قليل هاد العام، واش يكفيني السقي مرة فالسيمانة؟ |
| Rainfed follow-up | غير الشتا، ما عنديش السقي. |
| Soil | التراب عندي رملي فجهة وطيني فجهة. |
| Area and price | عندي جوج هكتارات ونص والثمن ثلاثمية درهم للقنطار. |
| French mixing | عندي deux hectares ديال blé وكنسقي ب goutte-à-goutte. |
| Local place | الأرض قريبة من الخميسات. واش عندكم المعطيات ديال الشتا؟ |
| Correction | سمح ليا، قلت الشعير ولكن كان القمح. |
| Observation | سجّل بلي لقيت الما واقف فواحد الجهة من الأرض. |

Review the clip with headphones. Transcribe the actual utterance with its dialect and code-switching. Keep a consistent script convention across the dataset, preserve French accents where practical, and keep numbers and units accurate. If noise makes a segment unintelligible, re-record it or explicitly reserve it for a noise evaluation. Keep unrelated personal details out of the collection.

## Listener evaluation

For TTS, randomize anonymized clips and have at least two Moroccan Darija speakers independently score intelligibility, naturalness, local pronunciation, agricultural terms, French terms and units on a 1–5 scale. Capture mispronounced spans verbatim and record whether the voice is consistent across turns. Keep the listening conditions and reference speaker consistent across models where possible.

For conversation, rate comprehension, usefulness, Darija naturalness and continuity. Check whether the assistant preserved corrections, correctly handled missing data, avoided unsupported claims, and asked for clarification at the right point. Record ratings before discussing model names.
