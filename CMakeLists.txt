include(FindPythonInterp)
if(PYTHONINTERP_FOUND)
	install(CODE
		"execute_process(COMMAND \"${PYTHON_EXECUTABLE}\" ${CMAKE_CURRENT_SOURCE_DIR}/build.py --dir \"${CMAKE_INSTALL_PREFIX}\")"
	)
endif()
