import { Component } from "vue-property-decorator";
import {
  ClientVideoStreamReceivingReport,
  ConsoleLogger,
  DefaultActiveSpeakerPolicy,
  DefaultDeviceController,
  DefaultMeetingSession,
  DefaultModality,
  DefaultVideoTransformDevice,
  LogLevel,
  MeetingSessionConfiguration,
  MeetingSessionStatusCode,
  BackgroundBlurVideoFrameProcessor,
  BackgroundBlurOptions,
  VoiceFocusDeviceTransformer,
  VoiceFocusSpec,
} from "amazon-chime-sdk-js";
import { mixins } from "vue-class-component";

@Component({})
export default class ChimeComponent extends mixins() {
  constructor() {
    super();
  }

  /**
   * Steep 1
   * Initial call, create meeting Object
   * */
  async createMeeting(): Promise<void> {
    const meeting = this.$store.getters["getMeeting"];
    const attendee = this.$store.getters["getAttendee"];
    const logger = new ConsoleLogger(
      "CHIME_CALL_LOGS createMeeting ",
      process.env.VUE_APP_ENVIRONMENT === "PRO" ? LogLevel.OFF : LogLevel.ERROR
    );
    const deviceController = new DefaultDeviceController(logger, {
      enableWebAudio: await VoiceFocusDeviceTransformer.isSupported(),
    });
    const meetingConfig = new MeetingSessionConfiguration(meeting, attendee);
    const meetingSession = new DefaultMeetingSession(
      meetingConfig,
      logger,
      deviceController
    );
    await this.$store.dispatch("setMeetingSessionAction", meetingSession);

    await this.setMeetingAudioInputDevice(meetingSession);
    await this.setMeetingVideoInputDevice(meetingSession);

    await this.bindMeetingAudioOutput(meetingSession);
    await this.bindMeetingLocalVideo(meetingSession);
    await this.removeOrAddAttendee(meetingSession);
  }
  /**
   * Step 2
   * Set audio input
   * */
  async setMeetingAudioInputDevice(
    meetingSession: DefaultMeetingSession,
    store: null | any | undefined = null
  ): Promise<void> {
    const audioInputId = !store
      ? this.$store.getters["getSelectedAudioInput"]
      : store?.getters["getSelectedAudioInput"];
    const microphone = "microphone" as PermissionName;
    const microphonePermission = await navigator.permissions
      .query({
        name: microphone,
      })
      .then((permissionStatus) => {
        permissionStatus.addEventListener("change", async () => {
          await this.setMeetingAudioInputDevice(
            meetingSession,
            !store ? this.$store : store
          );
        });
        return permissionStatus;
      });
    if (
      microphonePermission.state === "prompt" ||
      microphonePermission.state === "denied"
    ) {
      console.error("NO AUDIO INPUT PERMISSION");
      //await this.stopLoader(!store ? this.$store : store);
    }
    const audioInputDevices =
      await meetingSession?.audioVideo.listAudioInputDevices();
    if (!audioInputDevices || audioInputDevices.length === 0) {
      console.error("NO AUDIO INPUT");
      //await this.stopLoader(!store ? this.$store : store);
    }
    try {
      await meetingSession?.audioVideo.startAudioInput(
        this.checkDeviceIsAvailable(audioInputId, audioInputDevices)
          ? audioInputId
          : audioInputDevices[0].deviceId
      );
    } catch (error: any) {
      switch (error["name"]) {
        case "NotReadableError":
        case "TypeError":
        case "NotAllowedError":
        case "PermissionDeniedError":
        case "SecurityError": {
          break;
        }
      }
    }
  }
  /**
   * Step 3
   * Set audio output device
   * */
  async setMeetingAudioOutputDevice(
    meetingSession: any,
    store: any
  ): Promise<void> {
    const audioOutputId = !store
      ? this.$store.getters["getSelectedAudioOutput"]
      : store?.getters["getSelectedAudioOutput"];
    const audioOutputDevices =
      await meetingSession?.audioVideo.listAudioOutputDevices();
    if (!audioOutputDevices || audioOutputDevices.length === 0) return;
    try {
      await meetingSession?.audioVideo.chooseAudioOutputDevice(
        this.checkDeviceIsAvailable(audioOutputId, audioOutputDevices)
          ? audioOutputId
          : audioOutputDevices[0].deviceId
      );
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Step 4
   * Bind output audio
   * */
  private async bindMeetingAudioOutput(meetingSession: any) {
    const audioElement = document.getElementById("my-audio-element");
    if (!(audioElement instanceof HTMLAudioElement)) return;
    await this.setMeetingAudioOutputDevice(meetingSession, this.$store);
    meetingSession?.audioVideo.bindAudioElement(audioElement);
    const observer = {
      audioVideoDidStart: async () => {
        // do nothing
      },
    };
    meetingSession?.audioVideo.addObserver(observer);
  }

  checkDeviceIsAvailable(deviceId: string, deviceList: any): boolean {
    if (!deviceList || deviceList.length <= 0) return true;
    return deviceList.some((a: any) => a.deviceId === deviceId);
  }
  /**
   * Step 5
   * Set video devices
   * */
  async setMeetingVideoInputDevice(
    meetingSession: any,
    store: null | any | undefined = null
  ): Promise<void> {
    const videoInputId = !store
      ? this.$store.getters["getSelectedVideoInput"]
      : store?.getters["getSelectedVideoInput"];
    const cam = "camera" as PermissionName;
    const cameraPermission = await navigator.permissions
      .query({
        name: cam,
      })
      .then((permissionStatus) => {
        permissionStatus.addEventListener("change", async () => {
          await this.setMeetingVideoInputDevice(
            meetingSession,
            !store ? this.$store : store
          );
        });
        return permissionStatus;
      });
    if (
      cameraPermission.state === "prompt" ||
      cameraPermission.state === "denied"
    ) {
      console.error("NO AUDIO INPUT PERMISSION");
      // await this.stopLoader(!store ? this.$store : store);
    }
    const videoInputDevices =
      await meetingSession?.audioVideo.listVideoInputDevices(true);
    if (!videoInputDevices || videoInputDevices.length === 0) {
      console.error("NO VIDEO INPUT");
      //await this.stopLoader(!store ? this.$store : store);
    }

    try {
      await meetingSession?.audioVideo.chooseVideoInputDevice(
        this.checkDeviceIsAvailable(videoInputId, videoInputDevices)
          ? videoInputId
          : videoInputDevices[0].deviceId
      );
    } catch (error: any) {
      switch (error["name"]) {
        case "NotReadableError":
        case "TypeError":
        case "NotAllowedError":
        case "PermissionDeniedError":
        case "SecurityError": {
          break;
        }
      }
    }
  }
  /**
   * Step 6
   * Bind video local and external video
   * */
  private async bindMeetingLocalVideo(meetingSession: any): Promise<void> {
    const videoElement = document.getElementById("my-video-element");

    const observer = {
      audioVideoDidStop: (sessionStatus: any) => {
        const sessionStatusCode = sessionStatus.statusCode();
        if (sessionStatusCode === MeetingSessionStatusCode.MeetingEnded) {
          meetingSession.audioVideo.stopLocalVideoTile();
          meetingSession.audioVideo.realtimeMuteLocalAudio();
          meetingSession.audioVideo.stop();
          meetingSession.audioVideo.stopContentShare();
          window.location.reload();
        } else
          console.log(
            "Stopped with a session status code: ",
            sessionStatusCode
          );
      },
      videoTileDidUpdate: async (tileState: any) => {
        const { boundAttendeeId, localTile, tileId } = tileState;
        if (!boundAttendeeId) {
          return;
        }
        if (localTile) {
          const space = this.$store.getters["SpaceStore/getSpace"];
          await meetingSession.audioVideo.chooseVideoInputQuality(
            256,
            144,
            15,
            256
          );

          // this.displayLocalName();
          meetingSession?.audioVideo.bindVideoElement(
            tileState.tileId,
            videoElement
          );
        } else {
          await this.addOtherMeetingUser(
            meetingSession,
            tileState,
            boundAttendeeId,
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            require("@/assets/poster.webp")
          );
        }
      },
      contentShareDidStart: () => {
        //  this.$store.dispatch("setSharedScreenEnabledAction", true);
      },
      contentShareDidStop: () => {
        /*    this.$store.dispatch(
          "setSharedScreenEnabledAction",
          false
        ); */
      },
      // remoteVideoSourcesDidChange(videoSources: VideoSource[]) {},
    };
    meetingSession?.audioVideo.addContentShareObserver(observer);
    meetingSession?.audioVideo.addObserver(observer);
    meetingSession?.audioVideo.startLocalVideoTile();

    meetingSession?.audioVideo.start();
  }

  private async addOtherMeetingUser(
    meetingSession: any,
    tileState: any,
    attendeeId: any,
    image: any
  ) {
    const renderVideo = document.getElementById(
      `chime-participant-${attendeeId}`
    );

    /* Else, create new video element */
    const meetingParticipants = document.getElementById("meeting-participants");
    const newParticipantContainer = document.createElement("div");
    const newVideoContainer = document.createElement("video");
    /*  const infoIcon = document.createElement("i"); */
    const videoActionsContainer = document.createElement("div");
    /* set the label name*/

    // Video
    newVideoContainer.setAttribute("autoplay", "true");
    newVideoContainer.setAttribute("muted", "true");
    newVideoContainer.setAttribute("playsinline", "true");
    newVideoContainer.setAttribute("id", `video-${attendeeId}`);
    newVideoContainer.setAttribute("class", "video-element");
    newVideoContainer.setAttribute("class", "video-element");
    newVideoContainer.setAttribute("poster", image);

    newParticipantContainer.setAttribute(
      "id",
      `chime-participant-${attendeeId}`
    );
    newParticipantContainer.setAttribute("class", "video-container");
    // newParticipantContainer.style.marginBottom = '40px';
    newParticipantContainer.appendChild(newVideoContainer);
    /* newParticipantContainer.appendChild(infoIcon); */
    newParticipantContainer.appendChild(videoActionsContainer);
    if (meetingParticipants)
      meetingParticipants.appendChild(newParticipantContainer);
    const videoElement = document.getElementById(`video-${attendeeId}`);
    await meetingSession.audioVideo.bindVideoElement(
      tileState.tileId,
      videoElement
    );
  }
  async removeOrAddAttendee(
    meetingSession: DefaultMeetingSession
  ): Promise<void> {
    if (!meetingSession) return;
    const { AttendeeId } = this.$store.getters["getAttendee"];
    const attendeePresenceSet = new Set();
    meetingSession.audioVideo.realtimeSubscribeToAttendeeIdPresence(
      async (attendeeId, present, externalUserId) => {
        if (!present) {
          attendeePresenceSet.delete(externalUserId);
          const participantContainer = document.getElementById(
            `chime-participant-${attendeeId}`
          );
          if (!participantContainer) return;
          participantContainer.remove();
        } else {
          await attendeePresenceSet.add(externalUserId);
          if (AttendeeId !== attendeeId) {
            const t = meetingSession.audioVideo.getAllRemoteVideoTiles();
            const searchT = t
              .map((a) => a.state())
              .filter((a) => a.boundAttendeeId === attendeeId);
            let tileState = null;
            if (searchT.length <= 0) {
              const videoTile = meetingSession.audioVideo.addVideoTile();
              tileState = videoTile.state();
              tileState.boundAttendeeId = attendeeId;
              tileState.boundExternalUserId = externalUserId as string;
              tileState.active = true;
            } else {
              tileState = searchT[0];
            }
            await this.addOtherMeetingUser(
              meetingSession,
              tileState,
              attendeeId, // eslint-disable-next-line @typescript-eslint/no-var-requires
              require("@/assets/poster.webp")
            );
          }
        }
      }
    );
  }
}
