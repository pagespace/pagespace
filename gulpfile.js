var gulp = require('gulp'),
    jshint = require('gulp-jshint');

gulp.task('jshint', function() {
    return gulp.src('src/**/*.js')
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'));
});
gulp.task('default', ['jshint'], function() {

});