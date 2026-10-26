#!/bin/bash
set -e

# 输入文件
INPUT="../../public/logo.png"

cd "$(dirname "$0")"

SIZES=(16 24 32 48 64 128 256 512)

echo "Generating multi-size PNG icons for Linux & Wayland..."
for size in "${SIZES[@]}"; do
  convert "$INPUT" -resize "${size}x${size}" -define png:format=png32 "${size}x${size}.png"
done

# 生成 128x128@2x.png (即 256x256)
cp 256x256.png 128x128@2x.png

# 复制 512x512 为主 icon.png
cp 512x512.png icon.png

echo "Generating Windows multi-resolution .ico..."
convert 16x16.png 24x24.png 32x32.png 48x48.png 64x64.png 128x128.png 256x256.png icon.ico

echo "Generating macOS .icns..."
if command -v png2icns >/dev/null 2>&1; then
  png2icns icon.icns 16x16.png 32x32.png 128x128.png 256x256.png 512x512.png
elif command -v iconutil >/dev/null 2>&1; then
  mkdir -p DevCrate.iconset
  cp 16x16.png DevCrate.iconset/icon_16x16.png
  cp 32x32.png DevCrate.iconset/icon_16x16@2x.png
  cp 32x32.png DevCrate.iconset/icon_32x32.png
  cp 64x64.png DevCrate.iconset/icon_32x32@2x.png
  cp 128x128.png DevCrate.iconset/icon_128x128.png
  cp 256x256.png DevCrate.iconset/icon_128x128@2x.png
  cp 256x256.png DevCrate.iconset/icon_256x256.png
  cp 512x512.png DevCrate.iconset/icon_256x256@2x.png
  cp 512x512.png DevCrate.iconset/icon_512x512.png
  iconutil -c icns DevCrate.iconset -o icon.icns
  rm -rf DevCrate.iconset
fi

echo "All icons generated successfully."
