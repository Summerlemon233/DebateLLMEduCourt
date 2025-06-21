// 教师人格化功能测试
// 用于验证不同教师人格的prompt生成是否正确

import { applyTeacherPersona, getAllTeacherPersonas } from '../src/utils/teacherPersonas';

const testQuestion = "人工智能对教育的影响是什么？";

console.log('=== 教师人格化功能测试 ===\n');

const allTeachers = getAllTeacherPersonas();

allTeachers.forEach(teacher => {
  console.log(`📚 ${teacher.name} (${teacher.id}):`);
  console.log(`专长: ${teacher.specialty.join(', ')}`);
  console.log(`教学风格: ${teacher.teachingStyle}`);
  console.log(`标语: ${teacher.catchphrase}\n`);
  
  const personalizedPrompt = applyTeacherPersona(testQuestion, teacher.id);
  console.log(`应用人格化后的prompt长度: ${personalizedPrompt.length} 字符`);
  console.log(`包含原问题: ${personalizedPrompt.includes(testQuestion) ? '✅' : '❌'}`);
  console.log(`包含教师名称: ${personalizedPrompt.includes(teacher.name) ? '✅' : '❌'}`);
  console.log('---\n');
});

console.log('测试完成！如果所有项目都显示 ✅，说明教师人格化功能正常工作。');
