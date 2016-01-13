var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    concat = require('gulp-concat');

gulp.task('lint-client', function() {
    return gulp.src(['admin/dashboard/app/**/*.js', 'admin/inpage/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('lint-server', function() {
    return gulp.src(['src/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('build-client', [ 'lint-client' ], function() {
    return gulp.src('./admin/dashboard/app/**/*.js')
        .pipe(concat('admin-app.js'))
        .pipe(gulp.dest('./admin/dashboard/build'));
});

gulp.task('watch', [ 'build-client' ], function() {
    gulp.watch('./admin/dashboard/app/**/*.js', ['build-client']);
});

gulp.task('default', [ 'build-client', 'lint-server'], function() {
});