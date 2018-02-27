cmake_minimum_required(VERSION 3.0)

include(FindPythonInterp)
if(PYTHONINTERP_FOUND)
	add_custom_target("Blockly" ALL)
	add_custom_command(TARGET "Blockly" POST_BUILD COMMAND ${PYTHON_EXECUTABLE} ${CMAKE_CURRENT_SOURCE_DIR}/build.py --dir "${CMAKE_CURRENT_BINARY_DIR}/" COMMENT "Building Blockly")
	install(DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}/thymio-blockly-standalone DESTINATION .)
endif()
