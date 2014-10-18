var gulp = require('gulp'),
    jshint = require('gulp-jshint')
    jasmine = require('gulp-jasmine');;

gulp.task('lint', function() {
    return gulp.src('src/**/*.js')
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'));
});

gulp.task('test', [ 'lint' ], function () {
    gulp.src('**/*-spec.js')
        .pipe(jasmine());
});

gulp.task('default', ['lint'], function() {

});