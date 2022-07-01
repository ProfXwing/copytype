npx electron-packager . --icon=icon.ico --out=out --ignore=Great_Expectations.epub

for entry in "out"/*
do
    cp Great_Expectations.epub $entry
done