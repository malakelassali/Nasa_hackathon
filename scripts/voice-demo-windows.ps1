param(
    [string]$Python,
    [ValidateRange(1, 65535)][int]$Port = 8001
)

$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $project
try {
    if (-not $Python) {
        $bundled = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'
        $Python = if (Test-Path -LiteralPath $bundled) { $bundled } else { 'python' }
    }
    if (Test-Path -LiteralPath '.agrix-deps') {
        $env:PYTHONPATH = (Resolve-Path -LiteralPath '.agrix-deps').Path
    }
    $env:AGRIX_MODE = 'local'
    $env:AGRIX_DEVICE = 'cpu'
    $env:AGRIX_CHAT_MODEL = 'rules'
    $env:AGRIX_ASR_BACKEND = 'qwen'
    $env:AGRIX_ASR_FARM_GLOSSARY = '1'
    $env:AGRIX_TTS_BACKEND = 'hadra'
    $env:AGRIX_SPEECH_TIMEOUT = '300'
    if (-not $env:AGRIX_HADRA_REPLY_DIR -and (Test-Path -LiteralPath 'data/voice/hadra-replies')) {
        $env:AGRIX_HADRA_REPLY_DIR = 'data/voice/hadra-replies'
    }
    if (Test-Path -LiteralPath 'data/pretrained/moulsot/config.json') {
        $env:AGRIX_ASR_MODEL = 'data/pretrained/moulsot'
    }
    if (Test-Path -LiteralPath 'data/pretrained/hadra/model_ema.safetensors') {
        $env:AGRIX_TTS_MODEL = 'data/pretrained/hadra'
        $env:AGRIX_HADRA_VOCODER_DIR = 'data/pretrained/hadra'
    }
    $env:OMP_NUM_THREADS = '4'
    $env:MKL_NUM_THREADS = '4'
    $env:WANDB_MODE = 'disabled'
    $env:HF_HUB_DISABLE_TELEMETRY = '1'
    $env:HF_HOME = Join-Path $project '.hf-cache'

    & $Python -c 'import f5_tts.infer.utils_infer'
    if ($LASTEXITCODE -ne 0) { throw 'HADRA dependencies could not be loaded. See docs/voice-gpu.md.' }
    Write-Host "Open http://localhost:$Port after Uvicorn starts."
    & $Python -m uvicorn agrix_voice.app:configured_app --factory --host 127.0.0.1 --port $Port
    if ($LASTEXITCODE -ne 0) { throw "The voice demo exited with code $LASTEXITCODE." }
} finally {
    Pop-Location
}
