# School of Computing &mdash; Year 4 Project Proposal Form

> Edit (then commit and push) this document to complete your proposal form.
> Make use of figures / diagrams where appropriate.
>
> Do not rename this file.

## SECTION A

|                     |                   |
|---------------------|-------------------|
|Project Title:       | MirAI: Local Assistant  |
|Student 1 Name:      | Chee Hin Choa     |
|Student 1 ID:        | 21100497          |
|Student 2 Name:      | Georgijs Pitkevics      |
|Student 2 ID:        | 19355266            |
|Project Supervisor:  | Gareth Jones |

> Ensure that the Supervisor formally agrees to supervise your project; this is only recognised once the
> Supervisor assigns herself/himself via the project Dashboard.
>
> Project proposals without an assigned
> Supervisor will not be accepted for presentation to the Approval Panel.

## SECTION B

> Guidance: This document is expected to be approximately 3 pages in length, but it can exceed this page limit.
> It is also permissible to carry forward content from this proposal to your later documents (e.g. functional
> specification) as appropriate.
>
> Your proposal must include *at least* the following sections.


### Introduction

> Describe the general area covered by the project. 

The Project, MirAI, aims to create a open-source, local hosted smart assistant with the ability to interacting with user-specified services. MirAI will prioritize user data privacy by ensuring all data processing and integrations are executed on local device or within user's personal cloud. It can function across different devices and environments, and its modular design enable users to further customize the system's functionalities through a community-driven API gallery.


### Outline

> Outline the proposed project.

MirAI, stems from the Japanese word Mirai (未来), meaning 'future'. It is also a common name, which we have decided to use as the default name for our project as well as the Assistant.

MirAI is a local assistant, similar to that of Google Home Assistant. There is a hardware and software aspect to this project, as we will have to narrow down a minimum and reccomended required hardware specification list. There will be a device with a speaker and microphone, we may opt to use an older android phone, to influence upcycling of older unused phones. This is coupled with a home server (commonly referred to as a 'homelab') with a capable GPU.



The project will aim to accomplish three main goals:
1. A self-hosted alternative for a home assistant with no user data being sent to the cloud unless the user chooses to do so.
2. Low latency, if our solution is too slow and cannot compete with the speed of other assistants, it may defer people from using it.
3. Open-Source user contribution with 'API Modules' that can be downloaded via an official 'MiarAI' marketplace or from GitHub. These 'API Modules' will have two main fields, "Prompt" & "API Call", using this functionality the user can add additional features to the




### Background

> Where did the ideas come from?


The idea of MirAI came about from our own issues and opinions of personal home assistants like Google Assistant, Apple Homepod, and Amazon Alexa. Each one of them has limited functionality and sends user data to a the companies' own cloud. Over the years there has been many concerns and confirmed reports of user data being stolen by hackers or sold by X company to unknown third parties. 

Another gripe we had was the limited functionality of these platforms/devices. Each one does similar things, but each function is essentially 'hard-coded' into the device. You can ask "what's the weather like in Dublin", but you can't ask "What's the weather like and should I wear a jacket today".

### Achievements

> What functions will the project provide? Who will the users be?

The project will provide feature such as voice recognition, customizable integration, and a community-driven API gallery. User will be able to active MirAI via voice commands, and instructs the system to interpret and act upon  by interacting with locally hosted or public APIs. MirAI is custom to suited for privacy conscious individuals who prefer full control over their data. The expected users would be technology enthusiasts, DIY hobbyiests and privacy focused individuals.

### Justification

> Why/when/where/how will it be useful?

MirAI will be useful for users who is looking to hand free while automate tasks, control smart devices, or manage schedules while keeping their data private. This will be an alternative to cloud-based assistants, making sure user data ain't sharing with third parties. MirAI have the abikity to be deployed in homes, small offices, or DIY projects.

### Programming language(s)

> List the proposed language(s) to be used.

Python (for backend and API functionality)
JavaScript (for frontend: ReactJS/React Native)

### Programming tools / Tech stack

> Describe the compiler, database, web server, etc., and any other software tools you plan to use.
>
Backend: Flask for the API and server-side logic
Frontend: ReactJS for the web interface and React Native for the mobile application
LLM (Large Language Model): LLaMA 3 (8B model)
STT (Speech to Text) & TTS (Text to Speech): Integration with Tacotron 2 or Coqui TTS
Database: SQLite or MySQL for storing configurations and user data
Hosting: Local servers, personal cloud instances


### Hardware

> Describe any non-standard hardware components which will be required.

### Learning Challenges

> List the main new things (technologies, languages, tools, etc) that you will have to learn.
> <Advanced Speech Recognition models and integrating them with APIs
Implementing large-scale machine learning models like LLaMA for natural language processing
Expanding functionality to interact with multiple smart devices via MQTT protocols
Improving security and local data processing>

We will have to investigage into Advanced Speech Recognition models, intergrating with machine learning models like LLaMA for natural language processing. We aim to expand the functionality to interact with multiple smart devices via MQTT protocols. Lastly, it will be a challange to keep this on the smallest posible requirement.     
    
### Breakdown of work

> Clearly identify who will undertake which parts of the project.
>
> It must be clear from the explanation of this breakdown of work both that each student is responsible for
> separate, clearly-defined tasks, and that those responsibilities substantially cover all of the work required
> for the project.

- Backend and API Design: Creating the Flask backend to handle voice commands, API requests, and responses.
- Frontend Development: Designing the admin panel using ReactJS to configure backend settings and modules.
- LLM and NLP Integration: Implementing the LLaMA model for natural language processing.
Voice Functionality: Integrating Speech to Text and Text to Speech modules.
- Community Gallery: Implementing the API module gallery for users to share their custom modules.

#### Student 1

> *Student 1 should complete this section.*

#### Student 2

> *Student 2 should complete this section.*

## Example

> Example: Here's how you can include images in markdown documents...

<!-- Basically, just use HTML! -->

<p align="center">
  <img src="./res/cat.png" width="300px">
</p>