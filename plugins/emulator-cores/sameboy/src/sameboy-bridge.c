#include <emscripten/emscripten.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>

#include "gb.h"

#define SAMEBOY_FRAME_WIDTH 160
#define SAMEBOY_FRAME_HEIGHT 144
#define SAMEBOY_AUDIO_BUFFER_FRAMES 16384

static GB_gameboy_t *gameboy;
static uint32_t *pixels;
static uint8_t *rgba_pixels;
static int16_t audio_buffer[SAMEBOY_AUDIO_BUFFER_FRAMES * 2];
static size_t audio_read_index;
static size_t audio_write_index;

static void sameboy_audio_callback(GB_gameboy_t *gb, GB_sample_t *sample)
{
    (void)gb;

    const size_t next_write_index = (audio_write_index + 1) % SAMEBOY_AUDIO_BUFFER_FRAMES;
    if (next_write_index == audio_read_index) {
        return;
    }

    audio_buffer[audio_write_index * 2] = sample->left;
    audio_buffer[audio_write_index * 2 + 1] = sample->right;
    audio_write_index = next_write_index;
}

static void initialize(void)
{
    if (gameboy != NULL) {
        return;
    }

    gameboy = GB_init(GB_alloc(), GB_MODEL_CGB_E);
    pixels = calloc(SAMEBOY_FRAME_WIDTH * SAMEBOY_FRAME_HEIGHT, sizeof(*pixels));
    rgba_pixels = calloc(SAMEBOY_FRAME_WIDTH * SAMEBOY_FRAME_HEIGHT * 4, sizeof(*rgba_pixels));
    GB_set_pixels_output(gameboy, pixels);
    GB_set_sample_rate(gameboy, 48000);
    GB_apu_set_sample_callback(gameboy, sameboy_audio_callback);
}

EMSCRIPTEN_KEEPALIVE
int sameboy_load_rom(const uint8_t *rom, const size_t size)
{
    if (rom == NULL || size == 0) {
        return 0;
    }

    initialize();
    GB_load_rom_from_buffer(gameboy, rom, size);
    return 1;
}

EMSCRIPTEN_KEEPALIVE
void sameboy_run_frame(void)
{
    if (gameboy == NULL) {
        return;
    }

    GB_run_frame(gameboy);
    for (size_t pixel = 0; pixel < SAMEBOY_FRAME_WIDTH * SAMEBOY_FRAME_HEIGHT; pixel++) {
        const uint32_t color = pixels[pixel];
        rgba_pixels[pixel * 4] = (uint8_t)(color >> 16);
        rgba_pixels[pixel * 4 + 1] = (uint8_t)(color >> 8);
        rgba_pixels[pixel * 4 + 2] = (uint8_t)color;
        rgba_pixels[pixel * 4 + 3] = 0xff;
    }
}

EMSCRIPTEN_KEEPALIVE
const uint8_t *sameboy_frame_buffer(void)
{
    return rgba_pixels;
}

EMSCRIPTEN_KEEPALIVE
void sameboy_set_button(const int button, const int pressed)
{
    static const GB_key_t buttons[] = {
        GB_KEY_RIGHT,
        GB_KEY_LEFT,
        GB_KEY_UP,
        GB_KEY_DOWN,
        GB_KEY_A,
        GB_KEY_B,
        GB_KEY_SELECT,
        GB_KEY_START,
    };

    if (gameboy == NULL || button < 0 || button >= (int)(sizeof(buttons) / sizeof(buttons[0]))) {
        return;
    }

    GB_set_key_state(gameboy, buttons[button], pressed != 0);
}

EMSCRIPTEN_KEEPALIVE
size_t sameboy_audio_sample_count(void)
{
    if (audio_write_index >= audio_read_index) {
        return audio_write_index - audio_read_index;
    }

    return SAMEBOY_AUDIO_BUFFER_FRAMES - audio_read_index + audio_write_index;
}

EMSCRIPTEN_KEEPALIVE
size_t sameboy_copy_audio(int16_t *output, const size_t maximum_frames)
{
    size_t copied_frames = 0;

    while (copied_frames < maximum_frames && audio_read_index != audio_write_index) {
        output[copied_frames * 2] = audio_buffer[audio_read_index * 2];
        output[copied_frames * 2 + 1] = audio_buffer[audio_read_index * 2 + 1];
        audio_read_index = (audio_read_index + 1) % SAMEBOY_AUDIO_BUFFER_FRAMES;
        copied_frames++;
    }

    return copied_frames;
}
