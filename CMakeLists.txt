cmake_minimum_required(VERSION 3.0)

find_program(NPM_EXECUTABLE NAMES npm NO_CMAKE_FIND_ROOT_PATH)

if (NOT NPM_EXECUTABLE)
    message(FATAL_ERROR "Could not find npm")
endif()


set(timestamp_file ${CMAKE_CURRENT_BINARY_DIR}/timestamp.cmake)
set(timestamp_file2 ${CMAKE_CURRENT_BINARY_DIR}/timestamp2.cmake)

add_custom_target(Blockly ALL DEPENDS ${timestamp_file2})


add_custom_command(
    OUTPUT ${CMAKE_CURRENT_SOURCE_DIR}/package-lock.json
    COMMAND ${NPM_EXECUTABLE} install
    COMMENT "Installing Blockly dependencies"
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
    DEPENDS package.json
)

add_custom_command(
    OUTPUT ${timestamp_file2}
    COMMAND ${NPM_EXECUTABLE} --verbose run-script build
    COMMAND ${CMAKE_COMMAND} -E touch ${timestamp_file2}
    COMMENT "Building Blockly"
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
    DEPENDS package.json src/blockly_override.js src/thymio_blockly.js webpack.config.js package-lock.json ${timestamp_file}
)

install(DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/thymio_blockly DESTINATION .)

if(TARGET thymio-js-api)
    add_custom_command(
        OUTPUT ${timestamp_file}
        COMMAND ${NPM_EXECUTABLE} --verbose install  $<TARGET_PROPERTY:thymio-js-api,SOURCE_DIR>
        COMMAND ${CMAKE_COMMAND} -E touch ${timestamp_file}
        COMMENT "Installing mobsya-thymio-api"
        WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
        DEPENDS  $<TARGET_PROPERTY:thymio-js-api,DEPENDS> package.json
    )
endif()
