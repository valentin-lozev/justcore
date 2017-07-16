/// <binding AfterBuild='scripts' />
var gulp = require('gulp');
var concat = require('gulp-concat');
var minify = require('gulp-minify');
var es = require('event-stream');

var files = [
    "src/license",
    "src/types",
    "src/DSandbox",
    "src/DCore",
];

gulp.task('scripts', function () {
    return es.merge(
        gulp.src(files.map(file => file + '.ts'))
            .pipe(concat('dcore.ts'))
            .pipe(gulp.dest('dist')),

        gulp.src(files.map(file => file + '.js'))
        .pipe(concat('dcore.js'))
        .pipe(minify({
            ext: { min: '.min.js' },
            mangle: false,
            preserveComments: 'some'
        }))
        .pipe(gulp.dest('dist'))
    );
});