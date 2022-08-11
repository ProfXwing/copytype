rm -r out
npx electron-packager . --icon=icon.ico --out=out --ignore=Great_Expectations.epub

cd out

for entry in ./*
do
    cp ../Great_Expectations.epub $entry
    zip -r $entry.zip $entry 
    rm -r $entry
    echo "Finished building $entry"
done