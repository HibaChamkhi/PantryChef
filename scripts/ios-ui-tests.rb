#!/usr/bin/ruby
# Adds (idempotently) a PantryChefUITests XCUITest target and scheme to the
# generated iOS project. The ios/ folder is gitignored, so this runs before
# every `npm run test:ui`. Test sources live in e2e/ios.
require 'xcodeproj'

root = File.expand_path('..', __dir__)
project_path = File.join(root, 'ios', 'PantryChef.xcodeproj')
abort "No iOS project at #{project_path}. Run `npx expo prebuild --platform ios` or `npx expo run:ios` first." unless File.exist?(project_path)

project = Xcodeproj::Project.open(project_path)
app = project.targets.find { |t| t.name == 'PantryChef' } or abort 'PantryChef app target not found'
name = 'PantryChefUITests'
target = project.targets.find { |t| t.name == name }

unless target
  target = project.new_target(:ui_test_bundle, name, :ios, app.deployment_target)
  target.add_dependency(app)

  group = project.main_group.find_subpath(name, true)
  group.set_source_tree('SOURCE_ROOT')
  group.set_path('../e2e/ios')
  Dir[File.join(root, 'e2e', 'ios', '*.swift')].sort.each do |file|
    ref = group.new_file(File.basename(file))
    target.source_build_phase.add_file_reference(ref)
  end

  project.save
  puts "Added target #{name}"
else
  puts "Target #{name} already present"
end

# Always enforce settings so edits here apply to an existing target too.
target.build_configurations.each do |config|
  config.build_settings['PRODUCT_NAME'] = name
  config.build_settings['TEST_TARGET_NAME'] = app.name
  config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = 'com.pantrychef.app.uitests'
  config.build_settings['SWIFT_VERSION'] = '5.0'
  config.build_settings['GENERATE_INFOPLIST_FILE'] = 'YES'
  config.build_settings['CODE_SIGN_STYLE'] = 'Automatic'
  config.build_settings['CURRENT_PROJECT_VERSION'] = '1'
  config.build_settings['MARKETING_VERSION'] = '1.0'
  config.build_settings['TARGETED_DEVICE_FAMILY'] = '1,2'
end
project.save

scheme_path = Xcodeproj::XCScheme.shared_data_dir(project_path).join("#{name}.xcscheme")
unless File.exist?(scheme_path)
  scheme = Xcodeproj::XCScheme.new
  scheme.add_build_target(app)
  scheme.add_test_target(target)
  scheme.set_launch_target(app)
  scheme.save_as(project_path, name, true)
  puts "Added scheme #{name}"
end
