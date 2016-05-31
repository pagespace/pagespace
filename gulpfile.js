var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    concat = require('gulp-concat');

gulp.task('lint-client', function() {
    return gulp.src(['static/dashboard/app/**/*.js', 'static/inpage/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('lint-server', function() {
    return gulp.src(['src/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('build-client', [], function() {
    return gulp.src('./static/dashboard/app/**/*.js')
        .pipe(concat('admin-app.js'))
        .pipe(gulp.dest('./static/dashboard/build'));
});

gulp.task('watch', [ 'build-client' ], function() {
    gulp.watch('./static/dashboard/app/**/*.js', ['build-client']);
});

gulp.task('default', [ 'build-client', 'lint-server'], function() {
});