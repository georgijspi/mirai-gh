# School of Computing &mdash; Year 4 Project Proposal Form

## SECTION A

|                     |                   |
|---------------------|-------------------|
|Project Title:       | MirAI: Local Assistant  |
|Student 1 Name:      | Chee Hin Choa     |
|Student 1 ID:        | 21100497          |
|Student 2 Name:      | Georgijs Pitkevics      |
|Student 2 ID:        | 19355266            |
|Project Supervisor:  | Gareth Jones |

## SECTION B


### Introduction

The Project, MirAI, aims to create an open-source, local hosted smart assistant with the ability to interact with user-specific services. MirAI will prioritize user data privacy by ensuring all data processing and integrations are executed on a local device or within user's personal cloud. It can function across different devices and environments, and its modular design enable users to further customize the system's functionalities through a community-driven API gallery.


### Outline

MirAI, stems from the Japanese word Mirai (未来), meaning 'future'. It is also a common name, which we have decided to use as the name for our project as well as the default name for the Assistant.

MirAI is a local assistant, similar in purpose to that of Google Home Assistant. There is a hardware and software aspect to this project, as we will have to narrow down a minimum and recommended hardware specification list. There will be a device with a speaker and microphone, we may opt to use an older android phone, to influence upcycling of older unused phones. This is coupled with a home server (commonly referred to as a 'homelab') with a capable GPU.



The project will aim to accomplish three main goals:
1. A self-hosted alternative for a home assistant with no user data being sent to the cloud unless the user chooses to do so.
2. Low latency, if our solution is too slow and cannot compete with the speed of other assistants, it may defer people from using it.
3. Open-Source user contribution with 'API Modules' that can be downloaded via an official 'MirAI' marketplace or from GitHub. These 'API Modules' will have two main fields, "Prompt Phrase" & "API Call", using this functionality the user can add additional features to the assistant in which they can say the 'prompt phrases' and expect the result from the API call within the assistant's repsonse.




### Background

The idea of MirAI came about from our own issues and opinions of personal home assistants like Google Assistant, Apple Homepod, and Amazon Alexa. Each one of them has limited functionality and sends user data to the companies' own cloud. Over the years there has been many concerns and confirmed reports of user data being stolen by hackers or sold by a company to unknown third parties. 

Another gripe we had was the limited functionality of these platforms/devices. Each one does similar things, but each function is essentially 'hard-coded' into the device. You can ask "what's the weather like in Dublin?", but you can't ask "What's the weather like and should I wear a jacket today?".

This project was also inspired by an emerging trend within the software industry. A common new practice is to self-host LLM chat models on company-owned servers for the Software Engineers to use when writing code. This is also a result of being conscious of GDPR rules and preventing the sharing of internal code to external sources. Instead of limiting use of external tools like ChatGPT/Google Gemini, the company is able to host an open-source LLM chatbot that the internal employees may use to increase productivity if they so choose. 

### Achievements

The project will provide features such as speech recognition, customizable integration, and a community-driven API gallery. The user will be able to activate MirAI via voice commands, and instruct the system to interpret and act upon the commands by interacting with locally hosted or public APIs. MirAI is suited for privacy conscious individuals who prefer full control over their data. The expected users would be technology enthusiasts, DIY hobbyists and privacy focused individuals.

Our focus on achieving a well-rounded system in terms of functionality and also complexity lies in the following features we plan to implement:
- Low latency between speech input and the assistant's output that competes with off-the-shelf competitors like Google Home, Amazon Alexa and Apple Homepod.
- Having a set of minimal requirements, with potential to switch out LLMs of different parameter sizes to suit the user's hardware, along with a set of reccomended hardware specifications with fully fleshed out functionality and low latency. 
- 'Chained' actions, similar to Google Assistant's routines like "start my day", where the user sets a queue of actions to occur when given a custom phrase.
- An NLP module that determines, based on the user's prompt, whether it is a predetermined action to call an API from the 'API Module' list (like a weather API), or a general natural language question (like asking MirAI to tell the user a joke).


### Justification

MirAI will be an alternative to cloud-based assistants, making sure user data isn't being shared with third parties. MirAI have the ability to be deployed in homes, small offices, or DIY projects.

MirAI will be useful for users who are looking to automate tasks, control smart devices, or manage schedules while keeping their data private. 

MirAI's key Open-Source ideology will unlock the potential of personal digital assistants like never seen before. The user will be able to customize not only the functionality, but also the personality and voice of MirAI.

### Programming language(s)

- Python (for backend and API functionality)
- JavaScript/Typescript (for frontend: ReactJS/React Native)


### Programming tools / Tech stack

#### Backend:
**Flask\.py** - Python based library we will use to create the backend and API functionality to send data to the frontend.
**[oobabooga/text-generation-webui](https://github.com/oobabooga/text-generation-webui)** - "A Gradio web UI for Large Language Models." We will use this in the testing phases as it features a rich text generation backend support with it's own API. This can be used to easily test different LLMs and compare their performance.
**[Langchain](https://python.langchain.com/docs/introduction/)** - a widely-documented Python library for building LLM applications.
**[Coqui TTS](https://github.com/coqui-ai/TTS)** - TTS library with support for multiple languages and most TTS models.
**MySQL** - Database to hold everything relating to the application.
**Docker** - We plan to dockerize the application for easy user deployment.

#### Frontend:
**React JS/Native** - A popular frontend framework for visually appealing user design.

### Hardware

- PC/Server with capable GPU, we currently have a system on hand powered by an AMD Ryzen 24 thread CPU and an NVidia GeForce Titan XP 12GB GPU. Prior testing has shown that the Llama 3 8B model works well with such a configuration.
- Android device with a touch screen, we will be using it for the frontend display. It will be set in a docked station and we will use it as a Microphone & Speaker to interact with MirAI.

### Learning Challenges


We will have to investigate Advanced text to speech & speech to text models, intergrating with machine learning models like Llama for natural language processing. We aim to expand the functionality to interact with multiple smart devices via MQTT protocols. Lastly, it will be a challange to minimize the project to a state where it can be run on low power hardware. 
    
### Breakdown of work


We will be utilizing an agile system with the use of a Trello board and a sprint-based development cycle. Git flow will be used throughout the development for Feature, Bug, Develop and Main branches with pull-requests for new additions to the code.

Within the first 2-3 sprints we will utilize a pair-programming approach to ensure that both of us are communicating and participating in the early development stages of the project. We hope this will give us a clear understand on the breakdown of work and allow us to be aware of what the other person is working on and how each member's code interacts with the other's code.

#### Georgijs Pitkevics

- Backend and API Design: Creating the Flask backend to handle voice commands, API requests, and responses.
- LLM/NLP Integration & Testing: Choosing and implementing a model for LLM functionality. 
    - Creating a testing suite to compare and test different models, prompts and collect data based on input and output. This will be manually reviewed by the developers.
    - Creating the Chaining functionality for multiple actions in routines.
    - Testing and development of the NLP module which will be used to determine whether a prompt is an API Module call or a general LLM call.
- Backend unit testing of the different APIs.


#### Chee Hin Choa

- Voice Functionality: Integrating Speech to Text and Text to Speech modules.
- Frontend Development: Designing the admin panel using ReactJS to configure backend settings and modules.
- Community Gallery: Implementing the API module gallery for users to share their custom modules.
- Frontend unit testing.
