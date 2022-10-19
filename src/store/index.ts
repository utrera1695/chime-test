import Vue from "vue";
import Vuex from "vuex";
import axios from "axios";
Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    meeting: null,
    attendee: null,
    meetingSession: null,
    selectedVideoInput: null,
    selectedAudioInput: null,
    selectedAudioOutput: null,
  },
  mutations: {
    setAttendee: (state, payload) => {
      state.attendee = payload;
    },
    setMeeting: (state, payload) => {
      state.meeting = payload;
    },
    setMeetingSession: (state, payload) => {
      state.meetingSession = payload;
    },
  },
  actions: {
    joinMeetingAction: ({ commit }, { callback }) => {
      axios
        .post("https://chime-test.herokuapp.com/chime", {})
        .then((response) => {
          console.log(response);
          commit("setAttendee", response.data.attendeeData.Attendee);
          commit("setMeeting", response.data.attendeeData.Meeting);
          callback();
        })
        .catch((error) => console.log(error));
    },
    setMeetingSessionAction: ({ commit }, payload) => {
      commit("setMeetingSession", payload);
    },
  },
  getters: {
    getMeeting: (state) => {
      return state.meeting;
    },
    getAttendee: (state) => {
      return state.attendee;
    },
    getMeetingSession: (state) => {
      return state.meetingSession;
    },
    getSelectedAudioInput: (state) => {
      return state.selectedAudioInput;
    },
    getSelectedAudioOutput: (state) => {
      return state.selectedAudioOutput;
    },
    getSelectedVideoInput: (state) => {
      return state.selectedVideoInput;
    },
  },
  modules: {},
});
