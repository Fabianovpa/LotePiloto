#!/bin/bash
BRANCH=${1-"main"}
ENV=${2-"development"}
gulp watch --branch $BRANCH --env $ENV
