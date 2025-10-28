cmake_minimum_required(VERSION 3.27)
project(QtObjectModel LANGUAGES CXX)

find_package(Qt6 REQUIRED COMPONENTS Core Widgets)
qt_standard_project_setup(REQUIRES 6.10)

qt_add_executable(QtObjectModel main.cpp)
target_link_libraries(QtObjectModel
    PRIVATE
        Qt6::Core
        Qt6::Widgets
)
