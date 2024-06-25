document.addEventListener('DOMContentLoaded', () => {
    const instructionsDiv = document.getElementById('instructions');
    const imageElement = document.getElementById('image');
    const feedbackDiv = document.getElementById('feedback');
    const colors = ["red", "blue", "green"];
    const baseUrl = "https://raw.githubusercontent.com/maxsupergreenwald/FisherResources/main/resources/";
    let experimentData = [];
    let currentBlock = 0;
    let currentTrial = 0;
    let instructionStage = 0; // Tracks instruction stages (introduction vs. practice-to-experiment transition)
    let sessionType = 'practice'; // Alternates between 'practice' and 'real'
    let blockTrials; // Will hold trials for the current block
    const numPracticeBlocks = 2; // For example, 2 blocks for practice
    const numRealBlocks = 10; // For example, 10 blocks for the real experiment
    const trialsPerBlock = 20; // Assuming 20 trials per block
    
    
    // Set block orders for practice and real experiment
    const practiceOrder = (Math.random() < 0.5) ? [1,2] : [2,1]; // randomize practice block order
    // const blockOrderA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    // const blockOrderB = [10, 2, 8, 3, 1, 4, 5, 7, 9, 6];
    // const blockOrderC = [6, 7, 8, 1, 2, 4, 3, 9, 5, 10];
    let blockOrder = [1, 2, 3, 4];
    // setBlockOrder(); 
    console.log("blockOrder: " + blockOrder)
    // function setBlockOrder() {
    //     const randomIndex = Math.floor(Math.random() * 3);
    //     switch (randomIndex) {
    //         case 0: blockOrder = blockOrderA; break;
    //         case 1: blockOrder = blockOrderB; break;
    //         case 2: blockOrder = blockOrderC; break;
    //     }
    // }
    
    // Instructions text for each of the screens
    const initialInstructionTexts = [
        "Welcome to the experiment. A boy goes fishing for ten days. Each day he picks up fish from one of three ponds. Press the spacebar to proceed.",
        "In each trial, you will see a fish of a color. Determine which pond you think it belongs to. Press LEFT, UP, or RIGHT arrow key to select the pond. Press the spacebar to proceed.",
        "Try to respond as quickly and accurately as possible. Press the spacebar to start the practice session."
    ];
    
    const interSessionInstructionTexts = [
        "Practice session complete. Press the spacebar to continue to the next instructions.",
        "The real experiment will now begin. Remember to respond as quickly and accurately as possible. Press the spacebar to start."
    ];


    // Function to generate trial data with dynamic image URLs
    function generateTrials(session) {
        let allTrials = [];
        // Define the base path for JSON files
        const basePath = "./trials/";
        const setBlockOrder = (session === 'practice') ? practiceOrder : blockOrder;
        const promises = [];

        for (let blockIndex = 0; blockIndex < setBlockOrder.length; blockIndex++) {
            let block = setBlockOrder[blockIndex]; // the number (not index) associated with the block
            const filename = (session === 'practice') ? `practiceTrials${block}.json` : `mainTrials${block}.json`;
            const filePath = basePath + filename;
            
            // Use jQuery to fetch JSON data
            const promise = new Promise((resolve, reject) => {
                $.getJSON(filePath, function(data) {
                    // Process the JSON data and generate trials
                    const blockTrials = data.map(trial => {
                        let correctKey;
                        if (trial.pond3 === 'up') { correctKey = 'ArrowUp'; } 
                        else if (trial.pond3 === 'left') { correctKey = 'ArrowLeft'; } 
                        else if (trial.pond3 === 'right') { correctKey = 'ArrowRight'; }
                        
                        return {
                            fish1: trial.fish1,
                            fish2: trial.fish2,
                            fish3: trial.fish3,
                            fish4: trial.fish4,
                            fish5: trial.fish5,
                            correctKey,
                            block,
                            trial: trial.trial
                        };
                    });
                    resolve(blockTrials); // Resolve the promise with blockTrials
                });
            });
            promises.push(promise); // Push the promise into promises array
        }
        // Use Promise.all to wait for all promises to resolve
        return Promise.all(promises)
            .then(blocks => {
                // Flatten the array of blocks
                allTrials = blocks.flat();
                return allTrials;
            });
    }

    // Load trial information from JSON files
    // Wait for everything to load before continuing
    Promise.all([
        generateTrials("practice"),
        generateTrials("real")
    ])
    .then(([practiceTrials, realTrials]) => {
        console.log("Finished generating trials")
        const trialsInfo = {
            practice: practiceTrials,
            real: realTrials
        };

        console.log("allTrials: " + JSON.stringify(allTrials))
        console.log("trialsInfo: " + JSON.stringify(trialsInfo))
        console.log("trialsInfo.practice: " + trialsInfo.practice)
        console.log("trialsInfo.real: " + trialsInfo.real)

        everythingElse();
    })
    .catch(error => {
        console.error("Error generating trials:", error);
        // Handle any errors that occur during the generation of trials
    });

    function everythingElse() {
        // Display the first set of instructions initially
        instructionsDiv.textContent = initialInstructionTexts[0];

        
        // Function to start the practice or real experiment session
        function startSession(sessionType) {
            // Reset trials and blocks for the new session
            currentBlock = 1;
            currentTrial = 0;
            
            console.log("trialsInfo.sessionType: " + trialsInfo.sessionType)
            console.log("trialsInfo.sessionType[0]: " + trialsInfo.sessionType[0])
            blockTrials = trialsInfo.sessionType[currentBlock]; // Initialize with your actual trials data
            console.log("blockTrials: " + blockTrials)

            instructionsDiv.style.display = 'none';
            // Start trials or display inter-session instructions
            if (sessionType === 'practice' || sessionType === 'real') {
                nextTrial();
            } else if (sessionType === 'inter-session') {
                instructionStage = 0; // Reset instruction stage for inter-session instructions
                instructionsDiv.textContent = interSessionInstructionTexts[instructionStage];
                instructionsDiv.style.display = 'block';
            }
        }

        // Function to handle the transition to the next trial or block
        function nextTrial() {
            if (currentTrial < blockTrials.length) {
                displayTrial(blockTrials[currentTrial]);
                currentTrial++;
            } else if (currentBlock < (sessionType === 'practice' ? 2 : 10)) { // 2 blocks for practice, 10 for real
                currentBlock++;
                currentTrial = 0;
                // Show resting display for 5 seconds before the next block
                feedbackDiv.textContent = 'Rest for a moment. The next block will start in 5 seconds.';
                feedbackDiv.style.display = 'block';
                setTimeout(() => {
                    feedbackDiv.style.display = 'none';
                    blockTrials = trialsInfo[sessionType].slice(currentBlock * 20, (currentBlock + 1) * 20);
                    nextTrial();
                }, 5000);
            } else if (sessionType === 'practice') {
                // Transition from practice to real experiment
                sessionType = 'real';
                currentBlock = 0;
                currentTrial = 0;
                transitionToRealExperiment()
            } else {
                // Experiment complete
                endExperiment();
            }
        }

        // Function to display a trial and handle its timing and response capture
        function displayTrial(trial) {
            let startTime = Date.now();
            imageElement.src = trial.image;
            imageElement.style.display = 'block';
            feedbackDiv.style.display = 'none';

            // Handle key response or timeout
            const responseHandler = (event) => {
                if (['ArrowLeft', 'ArrowUp', 'ArrowRight'].includes(event.key)) {
                    document.removeEventListener('keydown', responseHandler);
                    clearTimeout(timeoutHandle);
                    let reactionTime = Date.now() - startTime;
                    let correct = event.key === trial.correctKey;
                    recordResult(trial, reactionTime, event.key, correct);
                    feedback(correct);
                }
            };

            // Set a timeout for the trial
            const timeoutHandle = setTimeout(() => {
                document.removeEventListener('keydown', responseHandler);
                feedbackDiv.textContent = 'Oops! Too slow.';
                feedbackDiv.style.display = 'block';
                recordResult(trial, 2000, 'none', false);
                setTimeout(nextTrial, 1000); // Move to next trial after 1 second
            }, 2000);

            document.addEventListener('keydown', responseHandler);
        }

        // Function to provide feedback and move to the next trial
        function feedback(correct) {
            feedbackDiv.textContent = correct ? 'Correct!' : 'Incorrect!';
            feedbackDiv.style.display = 'block';
            setTimeout(() => {
                imageElement.style.display = 'none';
                feedbackDiv.style.display = 'none';
                nextTrial();
            }, 1000); // Show feedback for 1 second
        }

        // Function to record the result of a trial
        function recordResult(trial, reactionTime, keyPress, correct) {
            experimentData.push({
                block: currentBlock,
                trial: currentTrial,
                image: trial.image,
                reactionTime,
                keyPress,
                correct,
                timestamp: new Date().toISOString(),
                session: sessionType
            });
        }

        // Start the experiment when the spacebar is pressed
        // Handle key press events
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space') {
                if (sessionType === 'practice' && instructionStage < initialInstructionTexts.length) {
                    // Display the next initial instruction
                    instructionsDiv.textContent = initialInstructionTexts[instructionStage];
                    instructionStage++;
                } else if (sessionType === 'practice' && instructionStage === initialInstructionTexts.length) {
                    // Start practice session after the last initial instruction
                    startSession('practice');
                } else if (sessionType === 'inter-session' && instructionStage < interSessionInstructionTexts.length) {
                    // Display the next inter-session instruction
                    instructionsDiv.textContent = interSessionInstructionTexts[instructionStage];
                    instructionStage++;
                } else if (sessionType === 'inter-session' && instructionStage === interSessionInstructionTexts.length) {
                    // Start real experiment after the last inter-session instruction
                    startSession('real');
                }
            }
        });


        // Transition to inter-session instructions
        function transitionToRealExperiment() {
            sessionType = 'inter-session';
            instructionsDiv.style.display = 'block';
            instructionStage = 0; // Reset instruction stage for inter-session
            instructionsDiv.textContent = interSessionInstructionTexts[instructionStage];
        }

        // Function to end the experiment and send data to the server
        function endExperiment() {
            // Placeholder for sending data to the server
            console.log('Experiment complete. Data:', experimentData);
            // Implement data submission to server here
        }

    }
    });
