/* exported VolumeMonitor */
// Volume Monitor

(function volumeMonitor () {
    'use strict';

    window.navigator.getUserMedia = (window.navigator.getUserMedia ||
        window.navigator.webkitGetUserMedia ||
        window.navigator.mozGetUserMedia ||
        window.navigator.msGetUserMedia);
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    var Uint8Array = window.Uint8Array;

    var VolumeMonitor = function (config) {
        this.listener = config.listener;
        this.onError = config.onError;
        this.onVolumeChange = config.onVolumeChange;
        this.onStop = config.onStop;

        this.stream = null;
        this.context = null;
        this.analyzer = null;
        this.frequencies = null;
        this.times = null;
        this.audioStarted = false;
    };

    VolumeMonitor.prototype.start = function () {
        var self = this;

        if (!this.audioStarted) {
            this.context = this.context || new AudioContext();
            this.analyzer = this.context.createAnalyser();
            this.analyzer.smoothingTimeConstant = 0.18;
            this.analyzer.fftSize = 256;

            this.frequencies = new Uint8Array(this.analyzer.frequencyBinCount);
            this.times = new Uint8Array(this.analyzer.frequencyBinCount);

            window.navigator.getUserMedia({ audio: true }, microphoneReady, function (err) {
                self.onError('The following error occurred: ' + err);
            });

            this.audioStarted = true;
        } else {
            loop();
        }


        function microphoneReady (stream) {
            self.stream = stream;
            var stream_source = self.context.createMediaStreamSource(stream);
            stream_source.connect(self.analyzer);
            loop();
        }

        function loop () {
            if (!(self.listener.pending || self.listener.listening)) {
                self.stop();
                return;
            }

            self.analyzer.getByteFrequencyData(self.frequencies);
            self.analyzer.getByteTimeDomainData(self.times);

            self.onVolumeChange && self.onVolumeChange(getVolume());

            window.setTimeout(loop, 75);
        }

        function getVolume () {
            return window.parseInt(getFrequencyRange(0, self.analyzer.frequencyBinCount - 1), 10);
        }

        function getFrequencyRange (from, to) {
            var volume = 0;

            for (var i = from; i < to; i++) {
                volume += self.frequencies[i];
            }

            return volume / ( to - from );
        }
    };

    VolumeMonitor.prototype.stop = function () {
        this.onStop && this.onStop();
        // stop recording
        this.stream && this.stream.stop();
        this.audioStarted = false;
    };

    window.VolumeMonitor = VolumeMonitor;

})();
