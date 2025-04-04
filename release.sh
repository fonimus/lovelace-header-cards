version=$1
message=$2

git add --all && git commit --message "fix: badge display" && git tag -a $version -m "$version" && git push origin $version && git push && gh release create $version --title "Release $version" --notes "$message" 'dist/*.js'
