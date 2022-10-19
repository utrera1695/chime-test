<template>
  <div>
    <div id="meeting-participants">
      <div id="local-participant" class="video-container">
        <video
          id="my-video-element"
          class="video-element"
          autoplay
          width="220"
          height="118"
          :poster="localVideoPoster"
        ></video>
        <span id="local-attendee-title" class="title-attendee" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { mixins } from "vue-class-component";
import { Component, Vue } from "vue-property-decorator";
import ChimeComponent from "./mixins/chime";

@Component({
  name: "call-component",
})
export default class CallComponent extends mixins(ChimeComponent) {
  localVideoPoster = require("@/assets/poster.webp");
  mounted() {
    this.onCameraOrSoundDisabled();
    this.createMeeting();
  }
  connect() {
    this.$store.dispatch("joinMeetingAction", {
      callback: () => {
        //this.createMeeting()
      },
    });
  }
  async onCameraOrSoundDisabled() {
    const videoDevices = [];
    const audioDevices = [];
    const deviceList = await navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => devices);
    const mediaDevicesList = JSON.parse(JSON.stringify(deviceList));
    mediaDevicesList.forEach((dev: any) => {
      if (dev.kind === "videoinput") videoDevices.push(dev);
      if (dev.kind === "audioinput") audioDevices.push(dev);
    });
    // Busca el estado de los permisos
    const cam = "camera";
    const cameraPermission = await navigator.permissions.query({
      name: cam,
    });
    const mic = "microphone";
    const microphonePermission = await navigator.permissions.query({
      name: mic,
    });
  }
}
</script>

<style></style>
