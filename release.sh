version=$1
message=$2

npm run build
/usr/bin/sed -i '' "s/\"version\": *\"[^\"]*\"/\"version\": \"$version\"/" package.json
git add --all
git commit --message "$message"
git tag -a $version -m "$version"
git push origin $version
git push
gh release create $version --title "$version" --notes "$message" './dist/lovelace-header-cards.js'
