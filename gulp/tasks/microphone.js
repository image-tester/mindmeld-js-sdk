/* jshint node: true, browser: false */

// gulpfile to build the MindMeldMicrophone source files

'use strict';

// gulp plugins
var gulp = require('gulp');
var sass = require('gulp-sass');
var minifyCSS = require('gulp-minify-css');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');

// Paths
var rootDirectory = __dirname + '/../../';
var relativeDistDirectory = 'dist/widgets/microphone/';
var relativeSrcDirectory = 'src/widgets/microphone/';
var distDirectory = rootDirectory + relativeDistDirectory;
var srcDirectory = rootDirectory + relativeSrcDirectory;

var paths = {
    js: [
        srcDirectory + '*.js',
    ],
    styles: [
        srcDirectory + '*.scss'
    ],
    html: [
        srcDirectory + '*.html'
    ],
    images: [
        srcDirectory + '/images/*'
    ]
};

// Compile and minify SCSS
gulp.task('mic.css', function () {
  return gulp.src(paths.styles)
    .pipe(sass())
    .pipe(gulp.dest(distDirectory))
    .pipe(minifyCSS())
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest(distDirectory));
});

// Concat and minify JS
gulp.task('mic.js', function () {
  return gulp.src(paths.js)
    .pipe(sourcemaps.init())
      // .pipe(concat(paths.js))
      .pipe(gulp.dest(distDirectory))
      .pipe(uglify(), {
        mangle: true
      })
      .pipe(rename({ extname: '.min.js' }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(distDirectory));
});

// Copy HTML
gulp.task('mic.html', function () {
    return gulp.src(paths.html)
        .pipe(gulp.dest(distDirectory));
});

// Copy Images
gulp.task('mic.images', function () {
    return gulp.src(paths.images)
        .pipe(gulp.dest(distDirectory + 'images/'));
});


// Main gulp task used to completely build the
// MindMeldMicrophone files
gulp.task('mic.build', ['mic.js', 'mic.css', 'mic.html', 'mic.images']);

// Watch for changes in source files and automatically build
gulp.task('mic.watch', ['mic.build'], function () {
    gulp.watch([paths.js], ['mic.js']);
    gulp.watch([paths.styles], ['mic.css']);
    gulp.watch([paths.html], ['mic.html']);
    gulp.watch([paths.images], ['mic.images']);
});
