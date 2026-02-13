import os
import subprocess
import jinja2
from src.schemas.resume_schema import Resume
from src.utils.template_utils import latextxt

class ResumeGenerator:
    def __init__(self, output_dir: str = "output"):
        self.output_dir = output_dir
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
        
        # Setup Jinja2 environment
        template_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
        self.env = jinja2.Environment(
            loader=jinja2.FileSystemLoader(template_dir),
            autoescape=jinja2.select_autoescape(['html', 'xml'])
        )
        self.env.filters['latextxt'] = latextxt

    def generate_tex(self, resume: Resume, filename: str = "resume") -> str:
        template = self.env.get_template("modern.tex.j2")
        # Pre-process resume object if needed (e.g. escape characters)
        # For now, we rely on jinja2 to handle simple replacements, 
        # but complex latex escaping should be done in helper filters.
        
        # We need a recursive function to escape all strings in the model
        # For simplicity in this iteration, we will just render and assume users don't break latex often
        # or we improve the filter later. 
        # Actually, let's use the latextxt filter in the template for safety.
        
        rendered_tex = template.render(resume=resume)
        
        output_path = os.path.join(self.output_dir, f"{filename}.tex")
        with open(output_path, "w") as f:
            f.write(rendered_tex)
            
        return output_path

    def generate_pdf(self, tex_path: str) -> str:
        try:
            # We must run pdflatex in the output directory or handle paths carefully
            # Simplest is to run in the directory of the tex file
            cwd = os.path.dirname(tex_path)
            basename = os.path.basename(tex_path)
            
            # recursive call often needed for references, but for this simple template once is usually enough
            # unless we add lastpage or similar packages.
            subprocess.run(
                ["pdflatex", "-interaction=nonstopmode", basename], 
                cwd=cwd, 
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE,
                check=True
            )
            
            pdf_path = tex_path.replace(".tex", ".pdf")
            return pdf_path
        except subprocess.CalledProcessError as e:
            print(f"Error compiling PDF: {e}")
            print(f"Stdout: {e.stdout.decode()}")
            print(f"Stderr: {e.stderr.decode()}")
            return None
        except FileNotFoundError:
            print("pdflatex not found. Please install TeX Live (latex-base).")
            return None
