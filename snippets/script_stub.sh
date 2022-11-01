#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail
if [[ "${TRACE-0}" == "1" ]]; then
    set -o xtrace
fi

usage() {
    echo "Usage: $0 -a <arg one> [-b <optional arg two>] [-c]"
    exit
}

if [[ "${1-}" =~ ^-*h(elp)?$ ]]; then
    usage
fi

# change directory to script dir
# cd "$(dirname "$0")"

main() {
    while getopts "a:b:c" opt
    do
        case "${opt}" in
            a) var_a=$OPTARG;;
            b) var_b=$OPTARG;;
            c) var_c=1;;
            *) usage;;
        esac
    done

    if [[ ! ${var_a:-} ]]; then
        usage
    fi

    echo "a: $var_a"

    if [[ ${var_b:-} ]]; then
        echo "b: $var_b"
    fi

    if [[ ${var_c:-} ]]; then
        echo "c: $var_c"
    fi

    echo "do awesome stuff"
}

main "$@"
