"use strict";

module.exports = function(grunt) {
  grunt.initConfig({
    mochaTest: {
      test: {
        options: {
          reporter: "spec",
          require: "babel-register"
        },
        src: ["test/**/*.js"]
      }
    },
    eslint: {
      all: ["src/**/*.js"]
    },
    release: {
      options: {
        tagName: "v<%= version %>",
        commitMessage: "Prepared to release <%= version %>."
      }
    },
    watch: {
      files: ["src/**/*.js"],
      tasks: ["build"]
    },
    babel: {
      options: {
        sourceMap: false
      },
      build: {
        files: [
          {
            expand: true,
            cwd: "src/",
            src: ["**/*.js"],
            dest: "build/",
            ext: ".js"
          }
        ]
      }
    },
    copy: {
      json: {
        files: [
          {
            expand: true,
            cwd: "src/",
            src: ["**/*.json"],
            dest: "build/",
            ext: ".json"
          }
        ]
      }
    },
    browserify: {
      tools: {
        options: {
          transform: ["babelify"]
        },
        files: {
          "./tools/build/tools.js": ["./tools/src/tools.js"]
        }
      }
    }
  });

  // load all grunt tasks
  require("matchdep")
    .filter(["grunt-*", "!grunt-cli"])
    .forEach(grunt.loadNpmTasks);
  require("matchdep")
    .filterDev(["grunt-*", "!grunt-cli"])
    .forEach(grunt.loadNpmTasks);

  grunt.registerTask("build", ["babel:build", "copy:json"]);
  grunt.registerTask("test", ["mochaTest"]);
  grunt.registerTask("lint", ["eslint"]);
  grunt.registerTask("tools", ["browserify:tools"]);
  grunt.registerTask("default", ["eslint", "test"]);
};
