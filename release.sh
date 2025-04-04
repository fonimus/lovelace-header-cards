version=$1
message=$2

npm run build
git add --all
git commit --message "fix: badge display"
git tag -a $version -m "$version"
git push origin $version
git push
gh release create $version --title "$version" --notes "$message" './dist/lovelace-header-cards.js'
