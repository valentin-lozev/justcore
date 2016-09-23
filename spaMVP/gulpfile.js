var gulp = require('gulp');
var concat = require('gulp-concat');
var minify = require('gulp-minify');
var es = require('event-stream');

var version = 'spaMVP-2.0.0';
var files = [
    "src/license",
    "src/helpers",
    "src/Sandbox",
    "src/Core",
    "plugins/mvp/Model",
    "plugins/mvp/HashSet",
    "plugins/mvp/Collection",
    "plugins/mvp/lib/UIEvent",
    "plugins/mvp/View",
    "plugins/mvp/Presenter",
    "plugins/mvp/mvp",
    "plugins/routing/UrlHash",
    "plugins/routing/Route",
    "plugins/routing/RouteConfig",
    "plugins/routing/routing",
    "plugins/services/services",
    "src/spaMVP"
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