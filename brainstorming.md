# Brainstorming

This file is used to document your thoughts, approaches and research conducted across all tasks in the Technical Assessment.

## Firmware
Stage 1: CAN Data Parsing

1. Setup dbcppp in your project

First, to setup dbcppp as a submodule, I referred to the git documentation and ran `git submodule add git@github.com:xR3b0rn/dbcppp.git`, followed by `git submodule update --init --recursive` to initialize and fetch all files.

I then similarly made use of the CMake documentation to link the dbcppp library to my executable main.cpp in CMakeLists.txt. 

All that was left was to initialize the dbcppp submodule to the Docker container before building, which was done with `RUN git submodule update --init --recursive` in the Dockerfile.

## Spyder

1. Since the `ui` service operates within a docker container, any code changes that you make will not be immediately reflected until you rebuild the containers. nodemon is a package which will help reflect any changes you make immediately by automatically restarting the node application when any file is changed. Your task is to install and configure the nodemon npm package into the `ui` directory.

I installed nodemon as a dev dependency in the ui directory through `npm install --save-dev nodemon` from the nodemon documentation. Since we want nodemon to execute the following dev and start commands whenever changes are made, I included `nodemon --exec` before the dev and start scripts.

2. When running the emulator, the client will occasionally receive values in the incorrect format. This will be visible in the output of `streaming service` as well as the `ui`. Think about what is happening, and write additional code in `streaming-service` that prevents 'invalid' data from being sent to the frontend. What you wish to do with 'invalid' data is up to you, so long as it is justified in `brainstorming.md`.

Running `docker compose up`, my first thought was that the incorrect format was of type `string` rather than a `number`. A closer look into the code in `battery_emulator` shows us that the number value was being converted to a binary string whenever it was less than the binary probability:

`
battery_temperature: Math.random() < BINARY_PROBABILITY 
  ? Buffer.from(new Uint32Array([generated_value]).buffer).toString('binary')
  : generated_value,
`

My guess on the purpose of this unnecessary-looking code is for some values to serve as 'invalid', get debugged, and filtered out (ignored), so I have just done that as opposed to converting it back to a `number`. My solution involves checking that the type of `battery_temperature` is `number` (i.e. it is valid) before sending data to the frontend.

3. A safe operating range for the battery temperature is 20-80 degrees. Add a feature to the backend `streaming-service` so that each time the received battery temperature exceeds this range more than 3 times in 5 seconds, the current timestamp and a simple error message is printed to console.

We first need to identify dangerous battery temperatures by adding an `if` condition. 'More than 3 times in 5 seconds' implies that we need some way of tracking these dangerous temperatures and their timestamps. My solution uses an array in which the timestamps of the dangerous temperatures are pushed each time identified. The rest was a matter of removing timestamps which were more than 5 seconds ago from the array and then checking if the length of the array was greater than 3. Due to my love for Javascript methods, I searched for one that allowed us to remove items from an array by condition and sure enough found the filter() method. 
 
However, I encountered a flaw in my implementation where the error message intended for one set of dangerous temperatures in the last 5 seconds would be printed again each time a new temperature was received so long as they all remained in the array.
Ideally, we want error messages to be printed for different and new sets of dangerous temperatures, so we know whether the error persists. It was an easy fix though, as all I had to do was remove the longest-ago timestamp each time an error message was printed (to ensure the same set of temperatures never persist in the array).

4. Currently the connect/disconnect button in the top right corner of the ui (frontend) does not update when data is streamed in via streaming service. Why is this occurring and what can be done to rectify this?

After running `docker compose up` and following the local host to check out the button, I navigated first to the `components` directory (because it seemed to be part of the nav bar) and then to the `app` directory. There, in `page.tsx`, we can see that one of the effect hooks is set with an empty dependency array: 

```
useEffect(() => {
  switch (readyState) {
    case ReadyState.OPEN:
      console.log("Connected to streaming service")
      setConnectionStatus("Connected")
      break
    case ReadyState.CLOSED:
      console.log("Disconnected from streaming service")
      setConnectionStatus("Disconnected")
      break
    case ReadyState.CONNECTING:
      setConnectionStatus("Connecting")
      break
    default:
      setConnectionStatus("Disconnected")
      break
  }
}, [])
```

This means that the hook only runs once (on mount) and does not re-run when the WebSocket state changes, explaining why `connectionStatus` remains unchanged. We can add `readyState` as a dependency array (since this is where the WebSocket state changes) so the hook runs every time `readyState` changes.

## Cloud