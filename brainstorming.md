# Brainstorming

This file is used to document your thoughts, approaches and research conducted across all tasks in the Technical Assessment.

## Firmware
Stage 1: CAN Data Parsing

1. Setup dbcppp in your project

First, to setup dbcppp as a submodule, I referred to the git documentation and ran `git submodule add git@github.com:xR3b0rn/dbcppp.git`, followed by `git submodule update --init --recursive` to initialize and fetch all files.

I then similarly made use of the CMake documentation to link the dbcppp library to my executable main.cpp in CMakeLists.txt. 

All that was left was to initialize the dbcppp submodule to the Docker container before building, which was done with `RUN git submodule update --init --recursive` in the Dockerfile.

## Spyder



## Cloud