import React, { Dispatch, SetStateAction } from 'react';
import { Button } from './button';

const StylizedSQLBlock = ({ sql }: {sql: string}) => {
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'JOIN', 'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'WITH', 'AS', 'INSERT', 'UPDATE', 'DELETE'
  ];
  
  const regex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');

  const stylizedSQL = sql.split('\n').map((line, index) => (
    <div key={index}>
      {line.split(regex).map((part, i) => 
        regex.test(part) ? (
          <span key={i}>{part}</span>
        ) : (
          part
        )
      )}
    </div>
  ));

  return <div>{stylizedSQL}</div>;
};

export const SQLBlock = ({ text, applyFunction }: {text:string, applyFunction:Dispatch<SetStateAction<string>>}) => {
  const sqlRegex = /```sql([\s\S]*?)```/; // Regex to find SQL block
  const match = text.match(sqlRegex);

  if (match) {
    const sql = match[1].trim(); // Extract the SQL part
    
    return (
      <div className='border rounded-md p-4 font-mono text-xs relative'>
        <Button size="sm" variant={"ghost"} className='absolute right-2 top-2 font-sans' onClick={()=>{applyFunction(sql)}}> Apply </Button>
        <StylizedSQLBlock sql={sql} />
      </div>
    );
  }

  return <div>{text}</div>; // Return original text if no SQL block found
};
