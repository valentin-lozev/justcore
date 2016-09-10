var gulp = require('gulp');
var concat = require('gulp-concat');
var minify = require('gulp-minify');

var version = 'spaMVP-2.0.0';
var files = [
          "src/license",
          "src/helpers",
          "src/mvp/Model",
          "src/mvp/HashSet",
          "src/mvp/Collection",
          "src/lib/UIEvent",
          "src/mvp/View",
          "src/mvp/Presenter",
          "src/routing/UrlHash",
          "src/routing/Route",
          "src/routing/RouteConfig",
          "src/core/Sandbox",
          "src/core/Core"
];

gulp.task('typescripts', function () {
    return gulp.src(files.map(file => file + '.ts'))
        .pipe(concat(version + '.ts'))
        .pipe(gulp.dest('dist/ts'));
});

gulp.task('javascripts', function () {
    return gulp.src(files.map(file => file + '.js'))
        .pipe(concat(version + '.js'))
        .pipe(minify({ ext: { min: '.min.js' } }))
        .pipe(gulp.dest('dist/js'));
});