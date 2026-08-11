#include <emscripten/emscripten.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>

#include "gb.h"
#include "sameboy-cgb-bootrom.h"

#define SAMEBOY_FRAME_WIDTH 160
#define SAMEBOY_FRAME_HEIGHT 144
#define SAMEBOY_AUDIO_BUFFER_FRAMES 16384

static GB_gameboy_t *gameboy;
static uint32_t *pixels;
static uint8_t *rgba_pixels;
static int16_t audio_buffer[SAMEBOY_AUDIO_BUFFER_FRAMES * 2];
static size_t audio_read_index;
static size_t audio_write_index;

static void sameboy_log_callback(GB_gameboy_t *gb, const char *string, GB_log_attributes_t attributes)
{
    (void)gb;
    (void)string;
    (void)attributes;
}

static uint32_t sameboy_rgb_encode_callback(GB_gameboy_t *gb, uint8_t red, uint8_t green, uint8_t blue)
{
    (void)gb;
    return ((uint32_t)red << 16) | ((uint32_t)green << 8) | blue;
}

static void sameboy_boot_rom_loader(GB_gameboy_t *gb, GB_boot_rom_t type)
{
    (void)type;
    GB_load_boot_rom_from_buffer(gb, sameboy_cgb_bootrom, sameboy_cgb_bootrom_len);
}

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
    GB_set_log_callback(gameboy, sameboy_log_callback);
    GB_set_rgb_encode_callback(gameboy, sameboy_rgb_encode_callback);
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
    GB_reset(gameboy);
    GB_set_boot_rom_load_callback(gameboy, sameboy_boot_rom_loader);
    GB_set_sample_rate(gameboy, 48000);
    GB_set_highpass_filter_mode(gameboy, GB_HIGHPASS_OFF);
    GB_apu_set_sample_callback(gameboy, sameboy_audio_callback);
    audio_read_index = 0;
    audio_write_index = 0;
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

EMSCRIPTEN_KEEPALIVE
size_t sameboy_battery_size(void)
{
    if (gameboy == NULL) {
        return 0;
    }
    const int size = GB_save_battery_size(gameboy);
    return size > 0 ? (size_t)size : 0;
}

EMSCRIPTEN_KEEPALIVE
int sameboy_battery_dirty(void)
{
    return gameboy != NULL && GB_get_battery_dirty(gameboy);
}

EMSCRIPTEN_KEEPALIVE
int sameboy_load_battery(const uint8_t *buffer, const size_t size)
{
    if (gameboy == NULL || buffer == NULL || size == 0) {
        return 0;
    }
    GB_load_battery_from_buffer(gameboy, buffer, size);
    GB_clear_battery_dirty(gameboy);
    return 1;
}

EMSCRIPTEN_KEEPALIVE
size_t sameboy_copy_battery(uint8_t *output, const size_t size)
{
    const size_t required = sameboy_battery_size();
    if (output == NULL || required == 0 || size < required) {
        return 0;
    }
    if (GB_save_battery_to_buffer(gameboy, output, required) != 0) {
        return 0;
    }
    GB_clear_battery_dirty(gameboy);
    return required;
}

EMSCRIPTEN_KEEPALIVE
size_t sameboy_save_state_size(void)
{
    return gameboy == NULL ? 0 : GB_get_save_state_size(gameboy);
}

EMSCRIPTEN_KEEPALIVE
size_t sameboy_copy_save_state(uint8_t *output, const size_t size)
{
    const size_t required = sameboy_save_state_size();
    if (output == NULL || required == 0 || size < required) {
        return 0;
    }
    GB_save_state_to_buffer(gameboy, output);
    return required;
}

EMSCRIPTEN_KEEPALIVE
int sameboy_load_save_state(const uint8_t *buffer, const size_t size)
{
    if (gameboy == NULL || buffer == NULL || size == 0) {
        return 0;
    }
    const int result = GB_load_state_from_buffer(gameboy, buffer, size);
    if (result != 0) {
        return 0;
    }
    audio_read_index = 0;
    audio_write_index = 0;
    return 1;
}
