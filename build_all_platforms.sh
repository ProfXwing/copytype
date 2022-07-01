npx electron-packager . --icon=icon.ico --out=out --platform=win32 --arch=arm64 --ignore=Great_Expectations.epub
npx electron-packager . --icon=icon.ico --out=out --platform=win32 --arch=x64 --ignore=Great_Expectations.epub
npx electron-packager . --icon=icon.ico --out=out --platform=win32 --arch=ia32 --ignore=Great_Expectations.epub

npx electron-packager . --icon=icon.ico --out=out --platform=darwin --arch=arm64 --ignore=Great_Expectations.epub
npx electron-packager . --icon=icon.ico --out=out --platform=darwin --arch=x64 --ignore=Great_Expectations.epub

npx electron-packager . --icon=icon.ico --out=out --platform=linux --arch=arm64 --ignore=Great_Expectations.epub
npx electron-packager . --icon=icon.ico --out=out --platform=linux --arch=armv7l --ignore=Great_Expectations.epub
npx electron-packager . --icon=icon.ico --out=out --platform=linux --arch=ia32 --ignore=Great_Expectations.epub
npx electron-packager . --icon=icon.ico --out=out --platform=linux --arch=x64 --ignore=Great_Expectations.epub

for entry in "out"/*
do
    cp Great_Expectations.epub $entry
done