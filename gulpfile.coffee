gulp = require 'gulp'
sass = require 'gulp-sass'
uncss = require 'gulp-uncss'
cssnano = require 'gulp-cssnano'
imagemin = require 'gulp-imagemin'
pngquant = require 'imagemin-pngquant'
imageResize = require 'gulp-image-resize'
imageop = require 'gulp-image-optimization'
rename = require 'gulp-rename'
uglify = require 'gulp-uglify'
imageSizes = [
  {
    w: 300
    h: 125
  }
  {
    w: 360
    h: 150
  }
  {
    w: 720
    h: 300
  }
  {
    w: 1440
    h: 600
  }
  {
    w: 1920
    h: 800
  }
]

gulp.task 'img', ->
  imageSizes.forEach (size) ->

    gulp.src './src/img/**/*.{jpg,jpeg,png}'
      .pipe imageResize
        width: size.w
        height: size.h
        crop: false
        upscale: false
      .pipe imagemin
        progressive: true
        svgoPlugins: [{removeViewBox: false}]
        optimizationLevel: 7
        use: [pngquant()]
      .pipe rename (path) ->
        path.basename += "-#{size.w}x#{size.h}"
      .pipe gulp.dest './img/'

gulp.task 'js', ->
  gulp.src './src/js/main.js'
    .pipe uglify()
    .pipe gulp.dest './js/'


gulp.task 'css', ->
  gulp.src('./src/sass/style.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(uncss({
      html: ['./_site/**/*.html'],
      ignore: [
        /toggled/,
        /post-meta/
      ]
    }))
    .pipe(cssnano())
    .pipe(gulp.dest('./css'))

gulp.task 'default', [ 'img', 'js', 'css' ]

