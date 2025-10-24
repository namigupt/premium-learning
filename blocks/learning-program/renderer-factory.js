import BaseRenderer from './renderers/base-renderer.js';
import LearningProgramRenderer from './renderers/learning-program-renderer.js';
import CourseRenderer from './renderers/course-renderer.js';
import CertificationRenderer from './renderers/certification-renderer.js';
import JobAidRenderer from './renderers/job-aid-renderer.js';

// eslint-disable-next-line max-classes-per-file

class RendererFactory {
  static createRenderer(data) {
    const learningObject = data.data;
    const { attributes } = learningObject;
    const loType = attributes.loType?.toLowerCase() || 'unknown';

    switch (loType) {
      case 'learningprogram':
      case 'learning_program':
      case 'program':
        return new LearningProgramRenderer();

      case 'course':
        return new CourseRenderer();

      case 'certification':
      case 'cert':
        return new CertificationRenderer();

      case 'jobaid':
      case 'job_aid':
        return new JobAidRenderer();

      default:
        // Log warning to service in production
        // console.warn(`Unknown loType: ${loType}, using base renderer`);
        return new BaseRenderer();
    }
  }

  static getSupportedTypes() {
    return [
      'learningprogram',
      'learning_program',
      'program',
      'course',
      'certification',
      'cert',
      'jobaid',
      'job_aid',
    ];
  }
}

export default RendererFactory;
