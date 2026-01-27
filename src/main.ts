/**
 * Main entry point for Bubble Video Engine (TypeScript)
 * TypeScript port of Python main.py
 *
 * Usage:
 *   npm run render                    # Use default project
 *   npm run render -- --project=myproject
 */

import { generateVideo } from './orchestrator.js';

async function main() {
  const startTime = Date.now();

  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let projectName = 'default';

    for (const arg of args) {
      if (arg.startsWith('--project=')) {
        projectName = arg.split('=')[1];
      } else if (arg === '--help' || arg === '-h') {
        printUsage();
        process.exit(0);
      }
    }

    // Run the orchestrator
    const outputPath = await generateVideo(projectName);

    // Success
    const elapsedSeconds = (Date.now() - startTime) / 1000;
    console.log(`\n✨ Success! Video generated in ${elapsedSeconds.toFixed(1)}s`);
    console.log(`📹 ${outputPath}\n`);

    process.exit(0);
  } catch (error) {
    // Error handling
    console.error('\n❌ ERROR:');
    if (error instanceof Error) {
      console.error(error.message);

      // Show stack trace in verbose mode
      if (process.env.VERBOSE === 'true') {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    } else {
      console.error(String(error));
    }

    console.error('\n💡 Troubleshooting:');
    console.error('   - Check that all API keys are set in .env');
    console.error('   - Ensure ffmpeg and ffprobe are installed');
    console.error('   - Verify script.json or raw_source.txt exists in project folder');
    console.error('   - Run with VERBOSE=true for full stack trace\n');

    process.exit(1);
  }
}

function printUsage() {
  console.log(`
Bubble Video Engine - TypeScript Edition

USAGE:
  npm run render                       Generate video for default project
  npm run render -- --project=NAME     Generate video for specific project

OPTIONS:
  --project=NAME    Project name (creates folder: projects/NAME)
  --help, -h        Show this help message

ENVIRONMENT:
  VERBOSE=true      Show detailed error stack traces

PROJECT STRUCTURE:
  projects/
    └── <project-name>/
        ├── raw_source.txt      (Optional) Raw text for LLM script generation
        ├── script.json         (Optional) Pre-made structured script
        ├── assets/             (Generated) Audio, video, scene files
        └── final_output.mp4    (Generated) Final rendered video

EXAMPLES:
  npm run render
  npm run render -- --project=ia_foundations
  VERBOSE=true npm run render -- --project=myproject

LEARN MORE:
  - VIDEO_BIBLE.md       Production guidelines
  - CLAUDE.md            Architecture overview
  - END_STATE_VISION.md  Roadmap
`);
}

// Run main
main();
