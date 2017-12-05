module.exports = function(grunt) {

	grunt.initConfig({

		/***************************************/
		/************ CONFIGURATION ************/
		/***************************************/

		pkg: grunt.file.readJSON("package.json"),
		config: {
			build : 'examples/scripts',
			dist : 'dist'
		},
		path : '<%= config[process.argv[2]] %>', // process.argv[2] = current Grunt overall task. Like default, build, etc. Not sub tasks like uglify.

		/***************************************/
		/************* COMMON TASKS ************/
		/***************************************/

		/**** REMOVE OLD CONTENT ****/

		clean: {
			options: {
				force: true
			},
			files: [
				'<%= path %>/**/**/**'
			]
		},

		/**** COPY ALL FILES ****/

		copy: {
			build: {
				expand: true,
				cwd: 'src',
				src: [
					'**/*',
				],
				dest: '<%= path %>'
			},
			dist: {
				expand: true,
				cwd: 'src',
				src: [
					'**/*',
				],
				dest: '<%= path %>',
				rename: function(dest, src) {
					return '<%= path %>/' + src.replace('keywords','keywords-' + '<%= pkg.version %>');
				}
			}
		},

		/**** PROCESS JS ****/

		uglify: {
			build: {
				expand: true,
				cwd: '<%= path %>',
				src: ['*.js','!*.min.js',],
				dest: '<%= path %>',
				ext: '.min.js',
				extDot: 'last'
			}
		},

		/**** WATCH FOR CHANGES TO SOURCE FILES AND RERUN BUILD TASKS ****/

		watch: {
			scripts: {
				files: ['src/**/**/*'],
				tasks: ['clean', 'copy', 'uglify'],
				options: {
					spawn: false,
				},
			} 
		},
	});

	// 2. Where we tell Grunt we plan to use this plug-in.
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-clean');

	// 3. Where we tell Grunt what to do when we type "grunt" into the terminal.
	grunt.registerTask('build', ['clean', 'copy:build', 'uglify', 'watch']);
	grunt.registerTask('dist', ['clean', 'copy:dist', 'uglify']);


};
