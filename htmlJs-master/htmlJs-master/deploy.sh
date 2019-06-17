#!/bin/bash
BRANCH=${1-"main"}
ENV=${2-"development"}
gulp --branch $BRANCH --env $ENV
