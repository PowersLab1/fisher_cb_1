document.addEventListener('DOMContentLoaded', () => {
    const imagesToPreload = [
        'stimuli/arrow.png',
        'stimuli/bead_b.PNG',
        'stimuli/bead_g.PNG',
        'stimuli/bead_y.PNG',
        'stimuli/box.png',
        'stimuli/feedback-arrow_left.png',
        'stimuli/feedback-arrow_up.png',
        'stimuli/feedback-arrow_right.png',
        'stimuli/ponds.png',
    ];

    function preloadImages(urls, callback) {
        let images = [];
        let loadedCount = 0;
        const totalCount = urls.length;

        for (const url of urls) {
            const image = new Image();
            image.onload = function() {
                loadedCount++;
                if (loadedCount === totalCount) {
                    callback();
                }
            };
            image.src = url;
            images.push(image);
        }
    }

    preloadImages(imagesToPreload, function() {
        startExperiment();
    });
});

function startExperiment() {
    const instructionsDiv = document.getElementById('instructions');
    const feedbackDiv = document.getElementById('feedback');
    const experimentDiv = document.getElementById("experimentContainer");
    
    let experimentData = []; // Will hold JSON data from experiment trials
    let currentBlock = 0;
    let currentTrial = 0;
    let instructionStage = 0; // Tracks instruction stages (introduction vs. practice-to-experiment transition)
    let sessionType = 'practice'; // Transitions from 'practice' to 'intersession' to 'real'
    let blockTrials; // Will hold trials for the current block

    // Store the responseHandler function outside of displayTrial
    let responseHandler;
    let keyHeldDown = false; // Flag to track if a key is being held down
    let arrowImageElement = document.getElementById('feedbackImage');
    
    // Set block orders for practice and real experiment
    const practiceOrder = (Math.random() < 0.5) ? [practiceTrials1, practiceTrials2] : [practiceTrials2, practiceTrials1]; // randomize practice block order
    const mainTrials = [mainTrials10, mainTrials2, mainTrials8, mainTrials3, mainTrials1, mainTrials4, mainTrials5, mainTrials7, mainTrials9, mainTrials6];
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
    }
    
    // Create blockOrder and shuffle it
    let blockOrder = [...mainTrials]; // Clone the mainTrials array to avoid mutating the original
    // shuffleArray(blockOrder); //WE NO LONGER SHUFFLE!!!!
    // console.log(blockOrder)
    // const blockOrderA = [mainTrials1, mainTrials2, mainTrials3, mainTrials4, mainTrials5, mainTrials6, mainTrials7, mainTrials8, mainTrials9, mainTrials10];
    // const blockOrderB = [mainTrials10, mainTrials2, mainTrials8, mainTrials3, mainTrials1, mainTrials4, mainTrials5, mainTrials7, mainTrials9, mainTrials6];
    // const blockOrderC = [mainTrials6, mainTrials7, mainTrials8, mainTrials1, mainTrials2, mainTrials4, mainTrials3, mainTrials9, mainTrials5, mainTrials10];
    // let blockOrder;
    // setBlockOrder(); 
    // console.log(blockOrder);
    
    // function setBlockOrder() {
    //     const randomIndex = Math.floor(Math.random() * 3);
    //     console.log("randomIndex: " + randomIndex)
    //     switch (randomIndex) {
    //         case 0: blockOrder = blockOrderA; break;
    //         case 1: blockOrder = blockOrderB; break;
    //         case 2: blockOrder = blockOrderC; break;
    //     }

    
    // Generate trials for practice and real experiment
    const practiceTrialsInfo = generateJStrials(practiceOrder);
    const realTrialsInfo = generateJStrials(blockOrder);

    function generateJStrials(blocksArray) {
        let allTrials = [];
        
        for (let blockIndex = 0; blockIndex < blocksArray.length; blockIndex++) {
            let blockTrials = blocksArray[blockIndex];
            allTrials = allTrials.concat([blockTrials]);
        }
        return allTrials;
    }

    // Instructions text for each of the screens
    // Instructions text for each of the screens
    const initialInstructionTexts = [
        'Welcome to the "Guess Which Pond!" Game'+
            '<br><br><br>Press "Q" Key (you may need to press twice) to continue.',
        '"Guess Which Pond!" Fishing Game'+
            "<br><br>Imagine a fisherman that goes fishing for 10 days." +
            "<br><br>He fishes from 3 ponds, each containing a mix of fish of 3 different colors (pictured below!)." +
            "<br><br>In each pond the majority of the fish are of a single color."+
            '<br><br><br>Press "Q" Key to proceed.',
        "Each day, the fisherman catches 15 fish. He will show you each fish he catches one by one (shown in a black square on the screen)." +
            '<br><br>Each turn, you will guess from which pond he got that fish of that color.' +
            '<br><br>The fisherman picks a new pond at the beginning of a new day, AND he may (or may not!) OCCASIONALLY CHANGE ponds within the SAME day.' + 
            '<br><br>So catching a fish of a color that is rare in the pond he has been fishing in could be due to chance...' + 
            '<br><br>OR it could mean he switched to a different pond!' + 
            '<br><br><br>Press "Q" Key to proceed.',
        'A correct guess is rewarded with $1, while an incorrect guess earns $0.' +
            '<br><br>Try to win as much money as possible -- the top 20% (1/5) participants will get $2 extra compensation!' + 
            '<br><br><br>Press "Q" Key to continue',
        'Press LEFT, UP or RIGHT arrows on your keyboard to pick the left, middle, or right pond.' +
            '<br><br>We will start with a PRACTICE session of 2 days of fishing.' + 
            '<br><br>During these PRACTICE days (but NOT the real game) you will be told whether the pond you guessed was correct!' + 
            '<br><br><br>Press "Q" Key to start the practice session.'
    ];
    
    const interSessionInstructionTexts = [
        "That's it for the 2 days of practice!" +
            '<br><br><br>Press "Q" Key to continue.',
        "The real game (10 days with 15 fish per day) will now begin!" +
            '<br><br>The game is the same as the practice -- Except you WILL NOT RECIEVE FEEDBACK ON WHETHER YOU ARE RIGHT OR WRONG!!' +
            '<br><br>Press LEFT, UP or RIGHT arrows on your keyboard to select your pond.' +
            "<br><br>Try to respond as quickly and accurately as possible." +
            '<br><br><br>Press "Q" Key to start.'
    ];

    const endInstructionText = " ";
    // const endInstructionText = "Thank you for completing the experiment. You may close the window now.";
    
    // Display the first set of instructions initially
    instructionsDiv.innerHTML = initialInstructionTexts[0];
    
    // Function to start the practice or real experiment session
    function startSession(sessionType) {

        if (sessionType === "practice") {
            blockTrials = practiceTrialsInfo[currentBlock]; // Initialize with your actual trials data    
        } else {
            blockTrials = realTrialsInfo[currentBlock]; // Initialize with your actual trials data    
        }
        
        console.log("currentBlock 1: " + currentBlock)
    
        instructionsDiv.style.display = 'none';
        // Start trials or display inter-session instructions
        if (sessionType === 'practice' || sessionType === 'real') {
            nextTrial();
        } else if (sessionType === 'inter-session') {
            instructionStage = 0; // Reset instruction stage for inter-session instructions
            instructionsDiv.innerHTML = interSessionInstructionTexts[instructionStage];
            instructionsDiv.style.display = 'block';
        }
    }

    // Function to handle the transition to the next trial or block
    function nextTrial() {
        experimentDiv.style.display = 'block';
        // Overlay key feedback
        // document.getElementById('leftPondOverlay').style.border = 'none';
        // document.getElementById('middlePondOverlay').style.border = 'none';
        // document.getElementById('rightPondOverlay').style.border = 'none';
        
        console.log("currentTrial: " + currentTrial)

        // Navigate to next trial, next block, or next session
        if (currentTrial < blockTrials.length) {
            // Going to the next trial 
            displayTrial(blockTrials[currentTrial]);
            
        } else if (currentBlock+1 < (sessionType === 'practice' ? practiceOrder.length : blockOrder.length)) { // number of blocks per practice/real session
            // Going to the next block
            currentBlock++;
            currentTrial = 0;
            
            // Show resting display for 5 seconds before the next block
            experimentDiv.style.display = 'none';
            instructionsDiv.style.display = 'block';
            instructionsDiv.innerHTML = 'Rest for a moment. The next day starts in 5 seconds.'
            setTimeout(() => {
                feedbackDiv.style.display = 'hidden';
                blockTrials = blockTrials.slice(currentBlock * 20, (currentBlock + 1) * 20); // update blockTrials array
                startSession(sessionType);
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
    // function displayTrial(trial) {
    //     let startTime = Date.now();
        
    //     // Show ponds and arrow images
    //     document.getElementById('pondsContainer').style.display = 'block';
    //     document.getElementById('arrowImage').style.display = 'block';
        
    //     // Add border box
    //     document.getElementById('fish1Container').style.border = '2px solid black';
    //     let boxTimeout = setTimeout(() => document.getElementById('fish1Container').style.border = '2px solid white', 2000);

    //     // Add fish images in specified order
    //     const fishOrder = [trial.fish1, trial.fish2, trial.fish3, trial.fish4, trial.fish5];
    //     let counter = 1;
    //     fishOrder.forEach(fish => {
    //         let elementId = 'fish' + counter.toString() + 'Image';
    //         let fishImage = document.getElementById(elementId);
    //         fishImage.src = fish;
    //         fishImage.style.display = 'block';
    //         counter += 1;
    //     });
        
    //     // Clear feedback div every trial
    //     feedbackDiv.style.display = 'none';

    //     // Handle key response or timeout within the displayTrial function
    //     const responseHandler = (event) => {
    //         if (['ArrowLeft', 'ArrowUp', 'ArrowRight'].includes(event.key)) {
    //             resizeOverlays();
    //             if      (event.key === 'ArrowLeft')    {document.getElementById('leftPondOverlay').style.border = '3px solid black'; } 
    //             else if (event.key === 'ArrowUp')      {document.getElementById('middlePondOverlay').style.border = '3px solid black'; }
    //             else if (event.key === 'ArrowRight')   {document.getElementById('rightPondOverlay').style.border = '3px solid black'; }

    //             document.getElementById('fish1Container').style.border = '2px solid white'
    //             document.removeEventListener('keydown', responseHandler);
    //             clearTimeout(timeoutHandle);
    //             let reactionTime = Date.now() - startTime;
    //             console.log("event.key: " + event.key)
    //             let correct = event.key.toLowerCase().includes(trial.pond3);
    //             recordResult(trial, reactionTime, event.key, correct);
    //             clearTimeout(boxTimeout);
    //             feedback(correct);
    //         }
    //     };

    //     // Set a timeout for the trial
    //     const timeoutHandle = setTimeout(() => {
    //         document.removeEventListener('keydown', responseHandler);
    //         feedbackDiv.innerHTML = 'Oops! Too slow.';
    //         feedbackDiv.style.display = 'block';
    //         recordResult(trial, 2000, 'none', false);
    //         clearTimeout(boxTimeout);
    //         setTimeout(nextTrial, 1000); // Move to next trial after 1 second
    //     }, 2000);

    //     document.addEventListener('keydown', responseHandler);
    // }
    // Store the responseHandler function outside of displayTrial
    let omitTooSoon;
    function displayTrial(trial) {
        let startTime = Date.now();
        let keydownHandled = false; // Flag to track if a key press has been handled
        let prematureKeyPress = true; // Flag to track if the key press was premature
        let userResponse = false; // Flag to track if the user has responded
        omitTooSoon = false;
        // Clear feedback every trial, clear instructions div in case carry over from transition screen
        instructionsDiv.style.display = 'none';
        feedbackDiv.style.display = 'none';

        // Handle premature key press
        const prematureResponseTimeout = setTimeout(() => {
            prematureKeyPress = false;
        }, 200);

        // Show ponds and arrow image
        document.getElementById('pondsContainer').style.display = 'block';
        document.getElementById('arrowImage').style.display = 'block';

        // Add border box
        document.getElementById('fish1Container').style.border = '2px solid black';
        //let boxTimeout = setTimeout(() => document.getElementById('fish1Container').style.border = '2px solid white', 2000);

        // Add fish images in specified order
        const fishOrder = [trial.fish1, trial.fish2, trial.fish3, trial.fish4, trial.fish5];
        let counter = 1;
        fishOrder.forEach(fish => {
            let elementId = 'fish' + counter.toString() + 'Image';
            let fishImage = document.getElementById(elementId);
            fishImage.src = fish;
            fishImage.style.display = 'block';
            counter += 1;
        });

        // Handle key response

        let lastKeyPressed = '';
        
        responseHandler = (event) => {
            if (['ArrowLeft', 'ArrowUp', 'ArrowRight'].includes(event.key) && !keydownHandled && !keyHeldDown) {
                if (prematureKeyPress) { // If it was a valid but premature key press
                    // feedbackDiv.innerHTML = 'You pressed too soon! 5 seconds waiting period now starts.';
                    feedbackDiv.innerHTML = 'You picked too quickly!';
                    feedbackDiv.style.display = 'block';
                    document.removeEventListener('keydown', responseHandler); // Remove the stored responseHandler
                    omitTooSoon = true;
                    // clearTimeout(trialDurationTimeout);
                    // setTimeout(() => {
                    //     feedbackDiv.style.display = 'none';
                    //     handleResponse(trial, startTime, lastKeyPressed);
                    // }, 5000);
                    // return;
                } else { // If it was a valid key press...
                    keydownHandled = true; // Set the flag to true to indicate a key press has been handled
                    keyHeldDown = true; // Set the flag to indicate a key is being held down
                    document.removeEventListener('keydown', responseHandler); // Remove the stored responseHandler
                    document.getElementById('fish1Container').style.border = '2px solid white';
                    lastKeyPressed = event.key;
                    userResponse = true;
                    
                    handleResponse(trial, startTime, lastKeyPressed);
                }
            }
        };

        // Handle key release
        const keyUpHandler = (event) => {
            if (['ArrowLeft', 'ArrowUp', 'ArrowRight'].includes(event.key)) {
                keyHeldDown = false; // Reset the keyHeldDown flag when the key is released
            }
        };

        document.addEventListener('keydown', responseHandler);
        document.addEventListener('keyup', keyUpHandler);

        // Set a timeout for the trial duration (3 seconds)
        const trialDurationTimeout = setTimeout(() => {
            if (!userResponse) {
                document.removeEventListener('keydown', responseHandler); // Remove the stored responseHandler
                document.removeEventListener('keyup', keyUpHandler); // Remove the keyup handler
                handleResponse(trial, startTime, ''); // Call the handleResponse function with 'none' as the key press
            }
        }, 3000); //MUST CHANGE BACK TO 3000!!!

        // // Set a timeout for the trial duration (2 seconds)
        // const trialDurationTimeout = setTimeout(() => {
        //     document.removeEventListener('keydown', responseHandler); // Remove the stored responseHandler
        //     document.removeEventListener('keyup', keyUpHandler); // Remove the keyup handler
        //     let reactionTime = Date.now() - startTime;
        //     let keyPress = 'none';
        //     let correct = '';
        //     feedback(correct, keyPress); // shouldn't need this
        //     nextTrial();

        //     if (keydownHandled && !prematureKeyPress && !keyHeldDown) {
        //         // User responded within the trial duration
        //         keyPress = lastKeyPressed;
        //         correct = lastKeyPressed.toLowerCase().includes(trial.pond3);
        //     }

        //     recordResult(trial, reactionTime, keyPress, correct);
        //     clearTimeout(boxTimeout);
        //     feedback(correct, lastKeyPressed);
        // }, 2000);
    }

    function handleResponse(trial, startTime, keyPress) {
        let reactionTime = Date.now() - startTime;
        let correct = keyPress.toLowerCase().includes(trial.pond3); //so basically this checks whether or not the key press corresponds to the correct pond in the current trial and marks it as TRUE or FALSE
        let correctPond = trial.pond3;
        let fish_displayed = trial.fish1;
        let fish_2 = trial.fish2;
        let fish_3 = trial.fish3;
        let fish_4 = trial.fish4;
        let fish_5 = trial.fish5;
        recordResult(trial, reactionTime, keyPress, correct, correctPond, fish_displayed, fish_2, fish_3, fish_4, fish_5);
        currentTrial++;
        feedback(correct, keyPress, omitTooSoon);
    }

    // Function to provide feedback and move to the next trial
    var additionalText = ''
    function feedback(correct, key, omitTooSoon) {
        if (sessionType === 'practice') {
            additionalText = correct ? 'Correct!' : 'Incorrect!';
        } else {
            additionalText = '';
        }

        if (key === 'ArrowLeft') {
            feedbackDiv.innerHTML = 'LEFT Pond ' + additionalText;
            arrowImageElement.src = 'stimuli/feedback-arrow_left.png';
            arrowImageElement.style.display = 'block';
        } else if (key === 'ArrowUp') {
            feedbackDiv.innerHTML = 'MIDDLE Pond. ' + additionalText;
            arrowImageElement.src = 'stimuli/feedback-arrow_up.png';
            arrowImageElement.style.display = 'block';
        } else if (key === 'ArrowRight') {
            feedbackDiv.innerHTML = 'RIGHT Pond ' + additionalText;
            arrowImageElement.src = 'stimuli/feedback-arrow_right.png';
            arrowImageElement.style.display = 'block';
        } else { // no response
            arrowImageElement.src = '';
            arrowImageElement.style.display = 'none';
            if (!omitTooSoon) { feedbackDiv.innerHTML = 'Oops! Too slow.'; }
            else { feedbackDiv.innerHTML = 'Please do not try to rush through the game!'; }
        }
        feedbackDiv.style.display = 'block';
        
        setTimeout(() => {
            feedbackDiv.style.display = 'none';
            arrowImageElement.style.display = 'none';
            nextTrial();
        }, 1000); // Show feedback for 1 second
        
    }

    // Function to record the result of a trial
    function recordResult(trial, reactionTime, keyPress, correct, correctPond, fish_displayed, fish_2, fish_3, fish_4, fish_5) {
        experimentData.push({
            block: currentBlock,
            trial: currentTrial,
            image: trial.image1,
            reactionTime,
            keyPress,
            correct,
            fish_displayed,
            fish_2,
            fish_3,
            fish_4,
            fish_5,
            timestamp: new Date().toISOString(),
            // blockOrder,
            correctPond,
            session: sessionType
        });
    }

    // Start the experiment when the spacebar is pressed
    // Handle key press events
    let turnOffSpace = false;
    document.addEventListener('keydown', (event) => {
        if (event.code === 'KeyQ') {
            if (sessionType === 'practice' && instructionStage < initialInstructionTexts.length) {
                console.log("contingency 1")
                // Display the next initial instruction
                instructionsDiv.innerHTML = initialInstructionTexts[instructionStage];
                instructionStage++;
            } else if (sessionType === 'practice' && instructionStage === initialInstructionTexts.length) {
                console.log("contingency 2")
                if (!turnOffSpace){
                    // Start practice session after the last initial instruction
                    console.log("contingency 2b")
                    startSession('practice');
                    turnOffSpace = true;
                } else {
                    // Once the practice session starts, don't implement above code again to prevent bugs
                    console.log("space bar pressed during trial --> ignore!")
                }
            } else if (sessionType === 'inter-session' && instructionStage < interSessionInstructionTexts.length) {
                console.log("contingency 3")
                // Display the next inter-session instruction
                instructionsDiv.innerHTML = interSessionInstructionTexts[instructionStage];
                instructionStage++;
            } else if (sessionType === 'inter-session' && instructionStage === interSessionInstructionTexts.length) {
                console.log("contingency 4")
                // Start real experiment after the last inter-session instruction
                sessionType = 'real';
                startSession('real');
            } 
        }
    });


    // Transition to inter-session instructions
    function transitionToRealExperiment() {
        sessionType = 'inter-session';
        instructionsDiv.style.display = 'block';
        experimentDiv.style.display = 'none';
        instructionStage = 0; // Reset instruction stage for inter-session
        instructionsDiv.innerHTML = interSessionInstructionTexts[instructionStage];
    }

    // Function to end the experiment and send data to the server
    function endExperiment() {
        experimentDiv.style.display = 'none';
        instructionsDiv.style.display = 'block';
        instructionsDiv.innerHTML = endInstructionText;
        
        // Implement data submission to server here
        console.log('Experiment complete. Data:', experimentData);
        const trialsDataJson = JSON.stringify(experimentData);
        sessionStorage.setItem('taskData', trialsDataJson);
        window.postMessage({
            type: 'labjs.data',
            json: trialsDataJson
        }, '*');
    }

};
