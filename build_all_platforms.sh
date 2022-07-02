# im really bad at shell but this should work well enough.
rm -r out
npx electron-packager . --icon=icon.ico --out=out --platform=win32,darwin,linux --arch=ia32,x64,arm64,armv7l --ignore=Great_Expectations.epub

cd out

finalize () {
    cp ../Great_Expectations.epub $1
    zip -r $1.zip $1 
    rm -r $1
    echo "Finished building $1"
}

for entry in ./*
do
    finalize $entry &
done

# if anyone knows how to make sure the the program is done before ending (letting you type in the terminal), please fix