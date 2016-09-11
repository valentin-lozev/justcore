var gulp = require('gulp');
var concat = require('gulp-concat');
var minify = require('gulp-minify');
var es = require('event-stream');

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
          "src/routing/DefaultRouteConfig",
          "src/core/Sandbox",
          "src/core/Core",
          "src/encapsulate"
];

gulp.task('scripts', function () {
    return es.merge(
        gulp.src(files.map(file => file + '.ts'))
            .pipe(concat(version + '.ts'))
            .pipe(gulp.dest('dist/ts')),

        gulp.src(files.map(file => file + '.js'))
        .pipe(concat(version + '.js'))
        .pipe(minify({
            ext: { min: '.min.js' },
            mangle: false,
            preserveComments: 'some'
        }))
        .pipe(gulp.dest('dist/js'))
    );
});