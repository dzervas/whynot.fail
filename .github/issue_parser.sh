#!/usr/bin/env bash

# Header is in the form "<!-- ,2020-12-20,/my/custom/url, -->"
export ISSUE_HEADER=$(head -n 1 <<< "${POST_BODY:?}")
export CUSTOM_DATE=$(cut -d, -f2 <<< "${ISSUE_HEADER}")
export POST_URL=$(cut -d, -f3 <<< "${ISSUE_HEADER}")
POST_BODY=$(tail -n +2 <<< "${POST_BODY}")

# Use a custom date, if given
if [ -n CUSTOM_DATE ] && date -d "${CUSTOM_DATE}" > /dev/null; then
	POST_DATE=${CUSTOM_DATE}
fi

# TODO: Support header image

# Process the labels to tags
export POST_TAGS=""
export ADDITIONAL_DATA=""
IFS=","
for label in ${POST_LABELS}; do
	if grep -q ":" <<< "${label}"; then
		ADDITIONAL_DATA=$(echo -en "${ADDITIONAL_DATA}\n${label}")
	elif [ "${label}" != "published" ]; then
		POST_TAGS=$(echo -en "${POST_TAGS}\n - ${label}")
	fi
done

# export POST_TAGS=$(echo -en "\n - ${POST_LABELS}" | sed -E 's/,/\n - /g')

cat << EndOfPost
---
writer: "${POST_AUTHOR}"
date: "${POST_DATE:?}"
tags:${POST_TAGS}
title: "${POST_TITLE:?}"
url: "${POST_URL}"
${ADDITIONAL_DATA}
---

${POST_BODY:?}
EndOfPost
