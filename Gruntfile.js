'use strict';

module.exports = function (grunt) {

	grunt.initConfig({
		mochaTest: {
			test: {
				options: {
					reporter: 'spec',
				},
				src: ['test/**/*.js']
			}
		},
		eslint: {
			all: ['src/**/*.js']
		},
		release: {
			options: {
				tagName: 'v<%= version %>',
				commitMessage: 'Prepared to release <%= version %>.'
			}
		},
		watch: {
			files: ['src/**/*.js'],
			tasks: ['build']
		},
		babel: {
			options: {
				sourceMap: false
			},
			build: {
				files: [{
					"expand": true,
					"cwd": "src/",
					"src": ["**/*.js"],
					"dest": "build/",
					"ext": ".js"
				}]
			}
		}
	});

	// load all grunt tasks
	require('matchdep').filter(['grunt-*', '!grunt-cli']).forEach(grunt.loadNpmTasks);
	require('matchdep').filterDev(['grunt-*', '!grunt-cli']).forEach(grunt.loadNpmTasks);

	grunt.registerTask('build', ['babel:build']);
	grunt.registerTask('test', ['mochaTest']);
	grunt.registerTask('default', ['eslint', 'test']);
};
