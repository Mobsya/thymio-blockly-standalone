cmake_minimum_required(VERSION 3.0)

find_program(NPM_EXECUTABLE NAMES npm NO_CMAKE_FIND_ROOT_PATH)

if (NOT NPM_EXECUTABLE)
    message(FATAL_ERROR "Could not find npm")
endif()


set(timestamp_file ${CMAKE_CURRENT_BINARY_DIR}/timestamp.cmake)


file(GLOB_RECURSE HTML_FILES "thymio_blockly/*.html" "thymio_blockly/*.css")

add_custom_target(blockly ALL DEPENDS ${timestamp_file} package-lock.json
    SOURCES package.json src/blockly_override.js src/thymio_blockly.js webpack.config.js package-lock.json ${HTML_FILES}
)

if(TARGET thymio-js-api)
    add_custom_command(
        OUTPUT ${CMAKE_CURRENT_SOURCE_DIR}/package-lock.json ${timestamp_file}
        COMMAND ${NPM_EXECUTABLE} install
        COMMAND ${NPM_EXECUTABLE} install  $<TARGET_PROPERTY:thymio-js-api,ABSOLUTE_SOURCE_DIR>
        COMMAND ${NPM_EXECUTABLE} run-script build
        COMMAND ${CMAKE_COMMAND} -E touch ${timestamp_file}
        COMMENT "Building Blockly dependencies"
        WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
        DEPENDS package.json $<TARGET_PROPERTY:thymio-js-api,DEPENDS> src/blockly_override.js src/thymio_blockly.js webpack.config.js
    )
else()
    add_custom_command(
        OUTPUT ${CMAKE_CURRENT_SOURCE_DIR}/package-lock.json ${timestamp_file}
        COMMAND ${NPM_EXECUTABLE} install
        COMMAND ${NPM_EXECUTABLE} run-script build
        COMMAND ${CMAKE_COMMAND} -E touch ${timestamp_file}
        COMMENT "Building Blockly dependencies"
        WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
        DEPENDS package.json $<TARGET_PROPERTY:thymio-js-api,DEPENDS> src/blockly_override.js src/thymio_blockly.js webpack.config.js
    )
endif()
install(DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/thymio_blockly DESTINATION .)
