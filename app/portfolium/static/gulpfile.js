"use strict";

const gulp = require("gulp")
const autoprefixer = require("gulp-autoprefixer");
const browsersync = require("browser-sync").create();
const cleanCSS = require("gulp-clean-css");
const plumber = require("gulp-plumber");
const rename = require("gulp-rename");
const sass = require("gulp-sass")(require("sass"));
const uglify = require("gulp-uglify");

function css() {
  return gulp
    .src("./scss/**/*.scss")
    .pipe(plumber())
    .pipe(sass({
      outputStyle: "expanded"
    }).on("error", sass.logError))
    .pipe(autoprefixer({
      cascade: false
    }))
    .pipe(gulp.dest("./css"))
    .pipe(rename({
      suffix: ".min"
    }))
    .pipe(cleanCSS())
    .pipe(gulp.dest("./css"))
    .pipe(browsersync.stream());
}

function js() {
  return gulp
    .src([
      './js/process/**/*.js',
      '!./js/process/fetch.js'
    ])
    .pipe(uglify())
    .pipe(gulp.dest('./js/min'))
    .pipe(browsersync.stream());
}

function watchFiles() {
  gulp.watch(["./scss/**/*"], css);
  gulp.watch(["./js/process/**/*"], js);
}

exports.css = css;
exports.js = js;
exports.default = watchFiles;