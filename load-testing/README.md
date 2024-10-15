# Load Testing

This folder contains scripts and resources for load testing our event ticketing system.

## Contents

- `load_testing.py`: The main Python script for simulating high load on the system.

## Overview

The load testing script simulates multiple users performing the following actions simultaneously:

1. Creating a user
2. Creating an event
3. Fetching event tickets
4. Holding a ticket
5. Purchasing a ticket

## Usage

To run the load test:

1. Ensure you have Python 3.7+ installed.
2. Install the required dependencies:
   ```
   pipenv install
   ```
3. Start a pipenv shell
    ```
    pipenv shell
    ```
3. Run the script:
   ```
   python load_testing.py
   ```

## Configuration

You can adjust the number of simulated users by modifying the range in the `simulate_high_load()` function.

## Results

The script will output the number of successful requests out of the total attempts, helping to identify any bottlenecks or issues in the system under high load.
